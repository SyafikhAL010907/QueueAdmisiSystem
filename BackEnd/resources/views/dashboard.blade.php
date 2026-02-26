<x-app-layout>
    <x-slot name="header">
        <h2 class="font-bold text-2xl text-purple-600 leading-tight">
            {{ __('Manajemen Antrian Admisi') }}
        </h2>
    </x-slot>

    <div class="py-12 bg-gradient-to-br from-purple-50 via-white to-blue-50 min-h-screen">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">

            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div
                    class="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-purple-100 shadow-sm text-center">
                    <span class="text-gray-500 text-xs font-bold uppercase tracking-widest">Waiting</span>
                    <h4 class="text-4xl font-black text-purple-600">1</h4>
                </div>
            </div>

            <div class="bg-white/80 backdrop-blur-md overflow-hidden border border-purple-100 shadow-xl sm:rounded-3xl">
                <div class="p-8">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h3 class="text-xl font-bold text-gray-800">Daftar Antrian Hari Ini</h3>

                        <!-- 🌍 LANGUAGE TOGGLE -->
                        <div class="flex items-center bg-gray-100 p-1 rounded-2xl gap-1">
                            <button onclick="setLanguage('ID')" data-lang="ID"
                                class="lang-btn px-4 py-2 rounded-xl text-xs font-bold transition-all bg-white shadow-sm ring-2 ring-purple-400">
                                🇮🇩 ID
                            </button>
                            <button onclick="setLanguage('AR')" data-lang="AR"
                                class="lang-btn px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-white/50">
                                🇸🇦 AR
                            </button>
                        </div>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="text-gray-400 text-sm uppercase">
                                    <th class="pb-4 px-4">Nama</th>
                                    <th class="pb-4 px-4">Nomor</th>
                                    <th class="pb-4 px-4">Aksi</th>
                                </tr>
                            </thead>
                            <tbody class="text-gray-700">
                                <tr class="border-t border-purple-50">
                                    <td class="py-4 px-4 font-medium">Maulana Syafikh</td>
                                    <td class="py-4 px-4"><span
                                            class="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm font-bold">A001</span>
                                    </td>
                                    <td class="py-4 px-4">
                                        <button onclick="panggilAntrian('Maulana Syafikh', 'A001', '1')"
                                            class="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:scale-105 transition">
                                            PANGGIL
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // 🌍 GLOBAL LANGUAGE TRIGGER (V5.1)
        // Standardize to queue_lang
        let activeLang = localStorage.getItem('queue_lang') || 'ID';

        function setLanguage(lang) {
            activeLang = lang;
            localStorage.setItem('activeLang', lang);
            document.querySelectorAll('.lang-btn').forEach(btn => {
                const isActive = btn.dataset.lang === lang;
                btn.classList.toggle('bg-white', isActive);
                btn.classList.toggle('shadow-sm', isActive);
                btn.classList.toggle('ring-2', isActive);
                btn.classList.toggle('ring-purple-400', isActive);
            });
            console.log("Language Set To:", lang);
        }

        // 🔊 INDONESIAN & ARABIC VOICE ENGINE (V4)
        function panggilAntrian(nama, nomor, loket) {
            // 🔍 DYNAMIC LANGUAGE CHECK (Anti-Amnesia)
            const currentLang = localStorage.getItem('queue_lang') || 'ID';

            // Anti-Double Voice Guard
            window.speechSynthesis.cancel();

            let pesan = "";
            let speechLang = "id-ID";

            if (currentLang === 'EN') {
                pesan = `Calling for ${nama}, queue number ${nomor}, please proceed to counter ${loket}.`;
                speechLang = "en-US";
            } else if (currentLang === 'ZH') {
                pesan = `请 ${nama}, ${nomor} 号, 到 ${loket} 号窗口.`;
                speechLang = "zh-CN";
            } else {
                // Indonesian Phonetic Mode
                // Indonesian Phonetic Mode
                const formatPhonetic = (str) => {
                    return str.toString().split('').map(char => {
                        if (char === '0') return 'kosong';
                        return char;
                    }).join(', ');
                };
                const phoneticNumber = formatPhonetic(nomor);
                pesan = `Panggilan untuk saudara, ${nama}. Nomor antrian, ${phoneticNumber}. Silakan menuju ke, loket ${loket}.`;
                speechLang = "id-ID";
            }

            const utterance = new SpeechSynthesisUtterance(pesan);
            utterance.rate = 0.75;
            utterance.pitch = 1.0;
            utterance.lang = speechLang;

            const setVoice = () => {
                const voices = window.speechSynthesis.getVoices();
                let chosenVoice = null;

                if (currentLang === 'EN') {
                    chosenVoice = voices.find(v => v.lang.toLowerCase().includes("en-us") && (v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("google") || v.name.toLowerCase().includes("natural")))
                        || voices.find(v => v.lang.toLowerCase().includes("en-us"));
                } else if (currentLang === 'ZH') {
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
                    console.log(`V5.1 Remote Dashboard: [${currentLang}] Command Synced ->`, chosenVoice.name);
                }

                // SILENT REMOTE MODE (V5.1): Dashboard does not speak locally.
                // window.speechSynthesis.speak(utterance);
            };

            if (window.speechSynthesis.getVoices().length > 0) {
                setVoice();
            } else {
                window.speechSynthesis.onvoiceschanged = setVoice;
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            setLanguage(activeLang);
        });
    </script>
</x-app-layout>