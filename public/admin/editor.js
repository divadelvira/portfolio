window.CMS_MANUAL_INIT = true;

const sectionDescriptions = {
  hero: 'Nama, profesi, ilustrasi, dan metrik pada bagian pembuka.',
  about: 'Foto profil dan informasi tentang diri Anda.',
  experience: 'Pengalaman kerja, peran, dan pencapaian.',
  projects: 'Judul, deskripsi, hasil, tautan, dan dokumentasi proyek.',
  skills: 'Kompetensi, perangkat, bukti keterampilan, dan radar.',
  awards: 'Prestasi, peringkat, penyelenggara, dan foto penghargaan.',
  education: 'Pendidikan, kegiatan kampus, dan tugas akhir.',
  training: 'Pelatihan, sertifikasi, keterampilan, dan foto.',
  contact: 'Email dan saluran kontak yang tampil di website.',
  settings: 'Teks tombol, judul browser, dan preview media sosial.',
};

const editorSections = new Map();

function editorLink(collection, file) {
  return `#/collections/${encodeURIComponent(collection.name)}/entries/${encodeURIComponent(file.name)}`;
}

function buildNavigation(config) {
  const nav = document.getElementById('cms-section-nav');
  const rows = document.getElementById('cms-section-rows');
  for (const collection of config.collections) {
    for (const [index, file] of collection.files.entries()) {
      const link = document.createElement('a');
      link.href = editorLink(collection, file);
      editorSections.set(link.getAttribute('href'), { title: collection.files.length === 1 ? collection.label : file.label, description: sectionDescriptions[collection.name] });
      link.dataset.collection = collection.name;
      link.textContent = index === 0 ? collection.label : file.label;
      if (collection.name === 'settings') link.classList.add('cms-settings-link');
      nav.append(link);
      const row = document.createElement('tr');
      const title = document.createElement('th');
      title.scope = 'row';
      const entry = link.cloneNode(true);
      entry.removeAttribute('data-collection');
      entry.textContent = collection.files.length === 1 ? collection.label : file.label;
      title.append(entry);
      const description = document.createElement('td');
      description.textContent = sectionDescriptions[collection.name] || 'Konten yang tampil di website.';
      const action = document.createElement('td');
      const edit = link.cloneNode(true);
      edit.removeAttribute('data-collection');
      edit.textContent = 'Edit';
      edit.setAttribute('aria-label', `Edit ${entry.textContent}`);
      action.append(edit);
      row.append(title, description, action);
      rows.append(row);
    }
  }
  const media = document.createElement('a');
  media.href = '#/media';
  media.textContent = 'Media';
  media.dataset.collection = 'media';
  nav.append(media);
}

function updateEditorState() {
  const root = document.getElementById('nc-root');
  const authenticated = Boolean(root?.querySelector('[class*="-AppHeaderContent"], [class*="-EditorContainer"]'));
  document.body.classList.toggle('cms-authenticated', authenticated);
  const route = window.location.hash;
  document.body.dataset.cmsView = route.startsWith('#/media') ? 'media' : route.includes('/entries/') ? 'editor' : 'index';
  const collection = route.split('/')[2];
  const section = editorSections.get(route);
  document.getElementById('cms-editor-title').textContent = section?.title || 'Editor konten';
  document.getElementById('cms-editor-description').textContent = section?.description || 'Perbarui field yang diperlukan, lalu tekan Simpan.';
  for (const control of root?.querySelectorAll('[class*="-ControlContainer"]') || []) {
    const label = control.querySelector(':scope > div > label');
    if (!label || !/^(English|Bahasa Inggris|Bahasa Indonesia)$/.test(label.textContent.trim())) continue;
    const group = control.parentElement;
    if (group.querySelectorAll(':scope > [class*="-ControlContainer"]').length === 2) group.classList.add('cms-bilingual-fields');
  }
  for (const link of document.querySelectorAll('#cms-section-nav a')) {
    if (link.dataset.collection === collection || (route.startsWith('#/media') && link.dataset.collection === 'media')) {
      link.setAttribute('aria-current', 'page');
    } else link.removeAttribute('aria-current');
  }
  for (const bar of root?.querySelectorAll('[class*="-TopBar-StyledListItemTopBar"]') || []) {
    const buttons = bar.querySelectorAll('button');
    if (buttons.length !== 2) continue;
    buttons[0].classList.add('cms-item-edit');
    buttons[0].setAttribute('aria-label', 'Edit atau tutup detail item');
    buttons[1].classList.add('cms-item-delete');
    buttons[1].setAttribute('aria-label', 'Hapus item');
  }
}

function missingIdPatches(data, fields, makeId = () => crypto.randomUUID()) {
  const patches = [];
  function walk(value, definitions, path) {
    for (const field of definitions || []) {
      const current = value?.[field.name];
      const at = [...path, field.name];
      if (field.widget === 'object') walk(current, field.fields, at);
      if (field.widget !== 'list' || !field.fields || !Array.isArray(current)) continue;
      const idField = field.fields.find(child => child.widget === 'hidden' && ['id', 'key', 'uid'].includes(child.name));
      const seen = new Set();
      current.forEach((item, index) => {
        if (idField) {
          let id = item?.[idField.name];
          if (!id || seen.has(id)) {
            id = makeId();
            patches.push({ path: [...at, index, idField.name], value: id });
          }
          seen.add(id);
        }
        walk(item, field.fields, [...at, index]);
      });
    }
  }
  walk(data, fields, []);
  return patches;
}

window.startPortfolioEditor = async function () {
  const loading = document.getElementById('cms-loading');
  try {
    const response = await fetch('/admin/config.yml');
    if (!response.ok) throw new Error(`Config HTTP ${response.status}`);
    const config = await response.json();
    const en = window.CMS.getLocale('en');
    window.CMS.registerLocale('id', {
      ...en,
      auth: { ...en.auth, login: 'Masuk', loggingIn: 'Menghubungkan…', loginWithGitHub: 'Masuk dengan GitHub' },
      app: { ...en.app, header: { ...en.app.header, content: 'Konten', media: 'Media' } },
      editor: {
        ...en.editor,
        editorControl: { ...en.editor.editorControl, field: { ...en.editor.editorControl.field, optional: 'opsional' } },
        editorToolbar: {
          ...en.editor.editorToolbar,
          publish: 'Simpan', published: 'Tersimpan', publishNow: 'Simpan perubahan', publishing: 'Menyimpan…',
          backCollection: '%{collectionLabel}', unsavedChanges: 'Belum disimpan', changesSaved: 'Perubahan tersimpan',
          deployPreviewPendingButtonLabel: 'Periksa preview', deployPreviewButtonLabel: 'Lihat preview',
        },
        editorWidgets: {
          ...en.editor.editorWidgets,
          list: { add: 'Tambah %{item}', addType: 'Tambah %{item}' },
          object: { expand: 'Buka', collapse: 'Ringkas' },
          image: {
            choose: 'Unggah / pilih gambar', chooseMultiple: 'Pilih gambar', chooseUrl: 'Gunakan URL gambar',
            replaceUrl: 'Ganti dengan URL', promptUrl: 'Masukkan URL gambar HTTPS', chooseDifferent: 'Ganti gambar',
            addMore: 'Tambah gambar', remove: 'Hapus gambar', removeAll: 'Hapus semua gambar',
          },
        },
      },
      mediaLibrary: {
        ...en.mediaLibrary,
        mediaLibrary: { ...en.mediaLibrary.mediaLibrary, onDelete: 'Hapus media yang dipilih? Pastikan gambar tidak sedang dipakai di website.' },
        mediaLibraryModal: { ...en.mediaLibrary.mediaLibraryModal, loading: 'Memuat…', close: 'Tutup', noResults: 'Tidak ditemukan.', noAssetsFound: 'Belum ada media. Unggah gambar untuk mulai.', noImagesFound: 'Belum ada gambar.', search: 'Cari gambar…', upload: 'Unggah gambar', uploading: 'Mengunggah…', deleteSelected: 'Hapus yang dipilih', chooseSelected: 'Gunakan gambar' },
      },
      ui: {
        ...en.ui,
        default: { goBackToSite: 'Kembali ke website' },
        settingsDropdown: { logOut: 'Keluar', account: 'Pengaturan akun' },
        toast: { ...en.ui.toast, entrySaved: 'Perubahan tersimpan', entryPublished: 'Perubahan tersimpan', missingRequiredField: 'Lengkapi field wajib sebelum menyimpan.' },
      },
    });
    buildNavigation(config);
    window.CMS.registerEventListener({
      name: 'preSave',
      handler: ({ entry }) => {
        const file = config.collections.flatMap(collection => collection.files).find(candidate => candidate.file === entry.get('path'));
        if (!file) throw new Error('Bagian tidak dikenali. Muat ulang editor sebelum menyimpan.');
        const data = entry.get('data');
        return missingIdPatches(data.toJS(), file.fields).reduce((updated, patch) => updated.setIn(patch.path, patch.value), data);
      },
    });
    const observer = new MutationObserver(() => {
      observer.disconnect();
      updateEditorState();
      observer.observe(document.getElementById('nc-root') || document.body, { childList: true, subtree: true });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('hashchange', updateEditorState);
    document.getElementById('cms-menu-toggle').addEventListener('click', function () {
      const open = this.getAttribute('aria-expanded') !== 'true';
      this.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('cms-menu-open', open);
    });
    document.getElementById('cms-section-nav').addEventListener('click', event => {
      if (!event.target.closest('a')) return;
      document.body.classList.remove('cms-menu-open');
      document.getElementById('cms-menu-toggle').setAttribute('aria-expanded', 'false');
    });
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !document.body.classList.contains('cms-menu-open')) return;
      document.body.classList.remove('cms-menu-open');
      const toggle = document.getElementById('cms-menu-toggle');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    });
    document.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button?.matches('.cms-item-delete, [class*="-FileWidgetButtonRemove"]')) return;
      if (!window.confirm('Hapus item ini? Perubahan baru diterapkan setelah Anda menekan Simpan.')) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);
    window.CMS.init({ config: { ...config, locale: 'id', load_config_file: false } });
    loading.remove();
  } catch (error) {
    console.error('Portfolio editor initialization failed:', error);
    loading.textContent = 'Editor gagal dimuat. Periksa koneksi internet, lalu muat ulang halaman.';
  }
};
