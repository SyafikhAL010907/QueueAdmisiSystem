<!DOCTYPE html>
<html>

<head>
    <title>Reservasi Antrian</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <script src="https://cdn.tailwindcss.com"></script>
</head>

<body class="bg-gradient-to-br from-purple-50 via-white to-blue-50 min-h-screen flex items-center justify-center p-6">

    <div
        class="bg-white/80 backdrop-blur-md p-10 rounded-3xl border border-purple-100 shadow-xl w-full max-w-sm text-center">
        <div class="mb-6">
            <x-application-logo class="w-16 h-16 mx-auto fill-current text-purple-400" />
        </div>
        <h1 class="text-3xl font-black text-gray-800 mb-2">Ambil Antrian</h1>
        <p class="text-gray-500 text-sm mb-8">Silakan masukkan nama Anda untuk memulai antrian</p>

        <input type="text" id="name" placeholder="Masukkan Nama Lengkap"
            class="border border-purple-100 bg-white/50 p-4 rounded-2xl w-full mb-6 focus:ring-4 focus:ring-purple-200 focus:border-purple-300 transition outline-none">

        <button onclick="ambilAntrian()"
            class="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8 py-4 rounded-2xl w-full font-bold shadow-lg transition transform active:scale-95">
            Ambil Nomor Antrian
        </button>

        <div id="result" class="mt-8"></div>
    </div>

    <script>
        const csrf = document.querySelector('meta[name="csrf-token"]').content;

        let myQueueId = null;
        let myQueueNumber = null;
        let pollingInterval = null;

        function ambilAntrian() {

            let name = document.getElementById('name').value;

            if (!name) {
                alert("Masukkan nama dulu");
                return;
            }

            fetch('/api/queues', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf
                },
                body: JSON.stringify({ name: name })
            })
                .then(res => res.json())
                .then(data => {

                    myQueueId = data.id;
                    myQueueNumber = data.queue_number;

                    document.getElementById('result').innerHTML =
                        "<div class='p-6 bg-purple-50 rounded-2xl border border-purple-100 animate-pop'>"
                        + "<span class='text-gray-500 text-xs font-bold uppercase tracking-widest'>Nomor Antrian Anda</span><br>"
                        + "<span class='text-6xl font-black text-purple-600'>"
                        + data.queue_number + "</span><br><br>"
                        + "<div class='flex items-center justify-center gap-2 text-gray-400'>"
                        + "<span class='w-2 h-2 bg-purple-300 rounded-full animate-pulse'></span>"
                        + "<span class='text-sm font-medium'>Menunggu dipanggil...</span>"
                        + "</div></div>";

                    document.getElementById('name').disabled = true;

                    mulaiPolling();
                });
        }

        function mulaiPolling() {

            pollingInterval = setInterval(() => {

                fetch('/api/queues')
                    .then(res => res.json())
                    .then(data => {

                        const myData = data.find(q => q.id === myQueueId);

                        if (!myData) return;

                        // 🔔 Kalau dipanggil
                        if (myData.status === 'called') {
                            if (document.getElementById('result').dataset.status !== 'called') {
                                document.getElementById('result').innerHTML =
                                    "<div class='p-6 bg-blue-50 rounded-2xl border border-blue-100 animate-bounce'>"
                                    + "<span class='text-blue-600 text-xl font-black uppercase tracking-tighter'>Waktunya Giliran Anda!</span><br><br>"
                                    + "<span class='text-gray-500 text-sm'>Silakan menuju ke</span><br>"
                                    + "<span class='text-4xl font-black text-gray-800'>LOKET "
                                    + myData.loket + "</span></div>";

                                document.getElementById('result').dataset.status = 'called';
                                speakCall(myData.name, myData.queue_number, myData.loket);
                                vibratePhone();
                            }
                        }

                        // ✅ Kalau selesai
                        if (myData.status === 'completed') {
                            document.getElementById('result').innerHTML =
                                "<div class='p-6 bg-green-50 rounded-2xl border border-green-100'>"
                                + "<span class='text-green-600 text-xl font-black'>Layanan Selesai</span><br><br>"
                                + "<p class='text-gray-500 text-sm'>Terima kasih telah menunggu!</p></div>";

                            resetApp();
                        }

                        // ❌ Kalau cancel
                        if (myData.status === 'canceled') {
                            document.getElementById('result').innerHTML =
                                "<div class='p-6 bg-red-50 rounded-2xl border border-red-100'>"
                                + "<span class='text-red-600 text-xl font-black'>Antrian Dibatalkan</span></div>";

                            resetApp();
                        }

                    });

            }, 3000);
        }

        // 🔊 INDONESIAN & ARABIC VOICE ENGINE (V4)
        // 🌍 GLOBAL LANGUAGE TRIGGER (V5)
        let activeLang = localStorage.getItem('queue_lang') || 'ID';

        window.addEventListener('storage', (e) => {
            if (e.key === 'queue_lang') {
                activeLang = e.newValue;
                console.log("V5 Engine: Mobile Syncing Language ->", activeLang);
            }
        });

        function speakCall(name, number, loket) {
            // 🔍 DYNAMIC LANGUAGE CHECK (Anti-Amnesia V5.1)
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
                    console.log(`V5.1 Silent Mobile: [${currentLang}] Command Synced ->`, chosenVoice.name);
                }

                // window.speechSynthesis.speak(utterance);
            };

            if (window.speechSynthesis.getVoices().length > 0) {
                setVoice();
            } else {
                window.speechSynthesis.onvoiceschanged = setVoice;
            }
        }

        function resetApp() {
            clearInterval(pollingInterval);
            document.getElementById('result').dataset.status = '';

            setTimeout(() => {
                document.getElementById('name').value = '';
                document.getElementById('name').disabled = false;
                document.getElementById('result').innerHTML = '';
                myQueueId = null;
            }, 4000);
        }

        function vibratePhone() {
            if (navigator.vibrate) {
                navigator.vibrate([500, 200, 500]);
            }
        }
    </script>

</body>

</html>