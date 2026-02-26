<x-app-layout>
    <x-slot name="header">
        <div class="relative flex items-center justify-between">
            <h2 class="font-bold text-2xl text-purple-600 leading-tight">
                {{ __('Manajemen Antrian Admisi') }}
            </h2>
            <div class="flex gap-4">
                <a href="/display" target="_blank"
                    class="bg-gradient-to-r from-purple-200 to-blue-200 text-gray-800 px-5 py-2.5 rounded-xl transition shadow-sm font-semibold hover:shadow-md active:scale-95 text-sm border border-purple-100">
                    Lihat Display
                </a>
            </div>
        </div>
    </x-slot>

    <style>
    </style>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">

            <!-- STATS COUNTER -->
            <div id="stats" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8 text-center"></div>

            <!-- FORM TAMBAH -->
            <div class="bg-white/70 backdrop-blur-sm p-8 rounded-2xl border border-purple-100 shadow-sm mb-8">
                <h3 class="text-xl font-bold mb-6 text-gray-700">Tambah Antrian Baru</h3>
                <form id="addForm" class="flex flex-col md:flex-row items-center gap-4">
                    <input type="text" name="name" placeholder="Nama Customer"
                        class="border border-purple-100 bg-white/50 p-4 rounded-2xl w-full focus:ring-4 focus:ring-purple-200 focus:border-purple-300 outline-none transition"
                        required>
                    <div class="flex items-center gap-2">
                        <button type="submit"
                            class="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8 py-4 rounded-2xl transition shadow-md font-bold whitespace-nowrap active:scale-95">
                            Tambah Data
                        </button>

                        <!-- 🌍 GLOBAL LANGUAGE TRIGGER (V5) -->
                        <div class="flex bg-gray-100 p-1 rounded-2xl gap-1 shadow-inner border border-gray-200">
                            <button type="button" onclick="setLanguage('ID')" data-lang="ID"
                                class="lang-btn px-3 py-2 rounded-xl text-xs font-bold transition-all bg-white shadow-sm ring-1 ring-purple-300">
                                🇮🇩 ID
                            </button>
                            <button type="button" onclick="setLanguage('EN')" data-lang="EN"
                                class="lang-btn px-3 py-2 rounded-xl text-xs font-bold transition-all hover:bg-white/50">
                                🇺🇸 EN
                            </button>
                            <button type="button" onclick="setLanguage('ZH')" data-lang="ZH"
                                class="lang-btn px-3 py-2 rounded-xl text-xs font-bold transition-all hover:bg-white/50">
                                🇨🇳 ZH
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <!-- TABLE MANAJEMEN -->
            <div class="bg-white/70 backdrop-blur-sm rounded-3xl shadow-sm border border-blue-50 overflow-hidden">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-gradient-to-r from-purple-50 to-blue-50">
                        <tr>
                            <th class="p-5 font-bold text-gray-600 text-sm uppercase tracking-wider">#</th>
                            <th class="p-5 font-bold text-gray-600 text-sm uppercase tracking-wider">Queue</th>
                            <th class="p-5 font-bold text-gray-600 text-sm uppercase tracking-wider">Name</th>
                            <th class="p-5 font-bold text-gray-600 text-sm uppercase tracking-wider">Status</th>
                            <th class="p-5 font-bold text-gray-600 text-sm uppercase tracking-wider text-center">Action
                            </th>
                        </tr>
                    </thead>
                    <tbody id="queueTable" class="divide-y divide-purple-50">
                        <!-- Loading placeholder atau data awal jika ada -->
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script>
        const csrf = document.querySelector('meta[name="csrf-token"]').content;

        // 🔄 AUTO REFRESH
        setInterval(loadQueues, 5000);
        loadQueues();

        // LOAD DATA
        function loadQueues() {
            fetch('/api/queues')
                .then(res => res.json())
                .then(data => {
                    let html = '';
                    let waiting = 0, called = 0, completed = 0, canceled = 0;

                    data.forEach((q, i) => {
                        if (q.status == 'waiting') waiting++;
                        if (q.status == 'called') called++;
                        if (q.status == 'completed') completed++;
                        if (q.status == 'canceled') canceled++;

                        if (q.status === 'completed' || q.status === 'canceled') return;

                        html += `
                    <tr class="hover:bg-purple-50/50 transition duration-300 group">
                        <td class="p-5 text-gray-500">${i + 1}</td>
                        <td class="p-5 font-bold text-purple-700">${q.queue_number}</td>
                        <td class="p-5 font-medium">${q.name}</td>
                        <td class="p-5">
                            <span class="px-3 py-1 rounded-full text-xs font-bold uppercase ${q.status === 'called' ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600'}">
                                ${q.status}
                            </span>
                        </td>
                        <td class="p-5 flex flex-wrap gap-2 justify-center">
                            <button onclick="callQueue(${q.id}, '${q.name}', '${q.queue_number}', 1)" class="bg-white border border-blue-200 hover:bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm active:scale-95">Call L1</button>
                            <button onclick="callQueue(${q.id}, '${q.name}', '${q.queue_number}', 2)" class="bg-white border border-purple-200 hover:bg-purple-50 text-purple-600 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm active:scale-95">Call L2</button>
                            <button onclick="callQueue(${q.id}, '${q.name}', '${q.queue_number}', 3)" class="bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm active:scale-95">Call L3</button>
                            <button onclick="callQueue(${q.id}, '${q.name}', '${q.queue_number}', 4)" class="bg-white border border-purple-200 hover:bg-purple-50 text-purple-600 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm active:scale-95">Call L4</button>
                            <button onclick="updateStatus(${q.id},'completed')" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-md active:scale-95">Done</button>
                            <button onclick="updateStatus(${q.id},'canceled')" class="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95">Cancel</button>
                        </td>
                    </tr>`;
                    });

                    document.getElementById('queueTable').innerHTML = html || '<tr><td colspan="5" class="p-10 text-center text-gray-400 italic">Antrian sedang kosong saat ini.</td></tr>';

                    document.getElementById('stats').innerHTML = `
                    <div class="bg-white p-6 rounded-3xl border border-yellow-100 shadow-sm transition hover:shadow-md">
                        <span class="text-xs font-bold uppercase tracking-widest text-yellow-600 mb-1 block">Waiting</span>
                        <b class="text-4xl text-gray-800">${waiting}</b>
                    </div>
                    <div class="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm transition hover:shadow-md">
                        <span class="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1 block">Called</span>
                        <b class="text-4xl text-gray-800">${called}</b>
                    </div>
                    <div class="bg-white p-6 rounded-3xl border border-green-100 shadow-sm transition hover:shadow-md">
                        <span class="text-xs font-bold uppercase tracking-widest text-green-600 mb-1 block">Completed</span>
                        <b class="text-4xl text-gray-800">${completed}</b>
                    </div>
                    <div class="bg-white p-6 rounded-3xl border border-red-100 shadow-sm transition hover:shadow-md">
                        <span class="text-xs font-bold uppercase tracking-widest text-red-600 mb-1 block">Canceled</span>
                        <b class="text-4xl text-gray-800">${canceled}</b>
                    </div>
                `;
                });
        }

        // ➕ ADD QUEUE AJAX
        document.getElementById('addForm').addEventListener('submit', function (e) {
            e.preventDefault();
            let name = this.name.value;

            fetch('/api/queues', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf
                },
                body: JSON.stringify({ name: name })
            }).then(() => {
                Swal.fire({
                    title: 'Berhasil!',
                    text: 'Antrian berhasil ditambahkan',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
                this.reset();
                loadQueues();
            });
        });

        // 🔁 UPDATE STATUS
        function updateStatus(id, status) {
            let endpoint = status === 'completed' ? 'complete' : 'cancel';

            fetch(`/api/queues/${id}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrf
                }
            }).then(() => {
                Swal.fire({
                    title: 'Updated!',
                    text: 'Status antrian berhasil diubah',
                    icon: 'success',
                    timer: 1000,
                    showConfirmButton: false
                });
                loadQueues();
            });
        }

        // 🔊 INDONESIAN PHONETIC AUDIO ENGINE (V3 - BULLETPROOF)
        // 🌍 GLOBAL LANGUAGE TRIGGER (V5)
        let activeLang = localStorage.getItem('queue_lang') || 'ID';

        function setLanguage(lang) {
            activeLang = lang;
            localStorage.setItem('queue_lang', lang);
            updateLangUI(lang);
            console.log("V5 Engine: Language Triggered ->", lang);
        }

        function updateLangUI(lang) {
            document.querySelectorAll('.lang-btn').forEach(btn => {
                const isActive = btn.dataset.lang === lang;
                btn.classList.toggle('bg-white', isActive);
                btn.classList.toggle('shadow-sm', isActive);
                btn.classList.toggle('ring-1', isActive);
                btn.classList.toggle('ring-purple-300', isActive);
                if (!isActive) {
                    btn.classList.add('hover:bg-white/50');
                } else {
                    btn.classList.remove('hover:bg-white/50');
                }
            });
        }

        // 🔄 CROSS-TAB SYNC
        window.addEventListener('storage', (e) => {
            if (e.key === 'queue_lang') {
                activeLang = e.newValue;
                updateLangUI(activeLang);
                console.log("V5 Engine: Syncing Language ->", activeLang);
            }
        });

        // 🔊 INDONESIAN PHONETIC AUDIO ENGINE (V5.1 - DYNAMIC)
        function speakQueue(name, number, loket) {
            // 🔍 DYNAMIC LANGUAGE CHECK
            const currentLang = localStorage.getItem('queue_lang') || 'ID';
            window.speechSynthesis.cancel();

            let message = "";
            let speechLang = "id-ID";

            if (currentLang === 'EN') {
                message = `Calling for ${name}, queue number ${number}, please proceed to counter ${loket}.`;
                speechLang = "en-US";
            } else if (currentLang === 'ZH') {
                message = `请 ${name}, ${number} 号, 到 ${loket} 号窗口.`;
                speechLang = "zh-CN";
            } else {
                // Default ID
                const formatPhonetic = (str) => {
                    return str.toString().split('').map(char => {
                        if (char === '0') return 'kosong';
                        return char;
                    }).join(', ');
                };
                const phoneticNumber = formatPhonetic(number);
                message = `Panggilan untuk saudara, ${name}. Nomor antrian, ${phoneticNumber}. Silakan menuju ke, loket ${loket}.`;
                speechLang = "id-ID";
            }

            const utterance = new SpeechSynthesisUtterance(message);
            utterance.rate = 0.8;
            utterance.pitch = 1.0;
            utterance.lang = speechLang;

            const setVoice = () => {
                const voices = window.speechSynthesis.getVoices();
                let chosenVoice = null;

                if (activeLang === 'EN') {
                    chosenVoice = voices.find(v => v.lang.toLowerCase().includes("en-us") && (v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("google") || v.name.toLowerCase().includes("natural")))
                        || voices.find(v => v.lang.toLowerCase().includes("en-us"));
                } else if (activeLang === 'ZH') {
                    chosenVoice = voices.find(v => v.lang.toLowerCase().includes("zh-cn") && (v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("google") || v.name.toLowerCase().includes("natural")))
                        || voices.find(v => v.lang.toLowerCase().includes("zh-cn"));
                } else {
                    const idVoices = voices.filter(v => v.lang.toLowerCase().includes("id-id") || v.lang.toLowerCase().includes("id_id"));
                    chosenVoice = idVoices.find(v => {
                        const n = v.name.toLowerCase();
                        return (n.includes("gadis") || n.includes("natural") || n.includes("online")) && !n.includes("andika");
                    }) || idVoices.find(v => {
                        const n = v.name.toLowerCase();
                        return (n.includes("google") || n.includes("siti") || n.includes("female")) && !n.includes("andika");
                    }) || idVoices.find(v => !v.name.toLowerCase().includes("andika")) || idVoices[0];
                }

                if (chosenVoice) {
                    utterance.voice = chosenVoice;
                    console.log(`V5.1 Silent Queue: [${currentLang}] Command Synced ->`, chosenVoice.name);
                }

                // window.speechSynthesis.speak(utterance);
            };

            if (window.speechSynthesis.getVoices().length > 0) {
                setVoice();
            } else {
                window.speechSynthesis.onvoiceschanged = setVoice;
            }
        }

        // Init UI
        updateLangUI(activeLang);

        function callQueue(id, name, number, loket) {
            // 🤖 SMART AUTO-OPEN (V5.6)
            const lastHeartbeat = localStorage.getItem('display_heartbeat');
            const isDisplayActive = lastHeartbeat && (Date.now() - lastHeartbeat < 3000);

            if (!isDisplayActive) {
                console.log("V5.6 Smart Auto-Open: Display inactive, opening new tab...");
                window.open('/display', '_blank');
            }

            fetch('/api/queues')
                .then(res => res.json())
                .then(data => {
                    const stillActive = data.find(q => q.status === 'called' && Number(q.loket) === loket);

                    if (stillActive) {
                        Swal.fire('Loket Masih Aktif!', `Loket ${loket} masih melayani ${stillActive.name}.`, 'warning');
                        return;
                    }

                    fetch(`/api/queues/${id}/call`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': csrf
                        },
                        body: JSON.stringify({ loket: loket })
                    })
                        .then(() => {
                            // 🚀 SYNC TRIGGER (V5.5): Force Display Speaker to bark instantly
                            localStorage.setItem('call_trigger', Date.now());

                            speakQueue(name, number, loket);
                            Swal.fire({
                                title: 'Dipanggil!',
                                text: `Antrian dipanggil ke Loket ${loket}`,
                                icon: 'success',
                                timer: 1500,
                                showConfirmButton: false
                            });
                            loadQueues();
                        });
                });
        }
    </script>
</x-app-layout>