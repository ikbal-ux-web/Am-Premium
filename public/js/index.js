// Local REST API endpoints (Vercel) – domain: https://alightmotion.qsr.web.id
const API_EMAIL_URL = "/api/email-prem";
const API_VERIFY_URL = "/api/vertif-prem";

let currentEmail = "";

const emailForm = document.getElementById('emailForm');
const verifyForm = document.getElementById('verifyForm');
const emailInput = document.getElementById('emailInput');
const urlInput = document.getElementById('urlInput');

const step1Container = document.getElementById('step1Container');
const step2Container = document.getElementById('step2Container');
const resultContainer = document.getElementById('resultContainer');

const displayEmail = document.getElementById('displayEmail');
const resEmail = document.getElementById('resEmail');
const btnBack = document.getElementById('btnBack');
const btnReset = document.getElementById('btnReset');

const alertBox = document.getElementById('alertBox');
const alertTitle = document.getElementById('alertTitle');
const alertMessage = document.getElementById('alertMessage');
const alertIcon = document.getElementById('alertIcon');

const waterLoadingOverlay = document.getElementById('waterLoadingOverlay');
const waterLoadingText = document.getElementById('waterLoadingText');

const badgeStep1 = document.getElementById('badgeStep1');
const badgeStep2 = document.getElementById('badgeStep2');

const joinModal = document.getElementById('joinModal');
const btnAlreadyJoined = document.getElementById('btnAlreadyJoined');

const tutorialModal = document.getElementById('tutorialModal');
const btnOpenTutorial = document.getElementById('btnOpenTutorial');
const btnCloseTutorial = document.getElementById('btnCloseTutorial');
const btnGotIt = document.getElementById('btnGotIt');

btnAlreadyJoined.addEventListener('click', () => {
    joinModal.classList.add('opacity-0', 'pointer-events-none');
    setTimeout(() => {
        joinModal.style.display = 'none';
        tutorialModal.classList.remove('opacity-0', 'pointer-events-none');
    }, 300);
});

btnOpenTutorial.addEventListener('click', () => {
    tutorialModal.classList.remove('opacity-0', 'pointer-events-none');
});

const closeTutorialAction = () => {
    tutorialModal.classList.add('opacity-0', 'pointer-events-none');
};
btnCloseTutorial.addEventListener('click', closeTutorialAction);
btnGotIt.addEventListener('click', closeTutorialAction);

function updateStepStyle(step) {
    if (step === 1) {
        badgeStep1.className = "step-item active";
        badgeStep2.className = "step-item inactive";
    } else {
        badgeStep1.className = "step-item inactive";
        badgeStep2.className = "step-item active";
    }
}

function showWaterLoading(text) {
    waterLoadingText.textContent = text;
    waterLoadingOverlay.classList.remove('opacity-0', 'pointer-events-none');
    waterLoadingOverlay.classList.add('opacity-100');
}

function hideWaterLoading() {
    waterLoadingOverlay.classList.remove('opacity-100');
    waterLoadingOverlay.classList.add('opacity-0', 'pointer-events-none');
}

function showAlert(type, title, msg) {
    alertBox.className = "alert show";
    if (type === 'success') {
        alertBox.classList.add('success');
        alertIcon.className = "fa-solid fa-circle-check";
    } else if (type === 'error') {
        alertBox.classList.add('error');
        alertIcon.className = "fa-solid fa-circle-exclamation";
    } else {
        alertBox.classList.add('success');
        alertIcon.className = "fa-solid fa-circle-info";
    }
    alertTitle.textContent = title;
    alertMessage.textContent = msg;
}

function hideAlert() {
    alertBox.className = "alert";
}

emailForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const email = emailInput.value.trim();
    if (!email) return;

    showWaterLoading("Mengirim Permintaan Email...");

    try {
        const response = await fetch(`${API_EMAIL_URL}?email=${encodeURIComponent(email)}`);
        const data = await response.json();

        if (response.ok && (data.status === true || data.code === 200 || data.success === true || data.message)) {
            currentEmail = email;
            displayEmail.textContent = email;
            showAlert('success', 'Berhasil Dikirim', data.message || 'Permintaan berhasil diproses. Masukkan URL verifikasi.');

            step1Container.classList.add('hidden');
            step2Container.classList.remove('hidden');
            updateStepStyle(2);
        } else {
            showAlert('error', 'Gagal Mengirim', data.message || 'Terjadi kesalahan pada sistem server.');
        }
    } catch (error) {
        showAlert('error', 'Koneksi Terputus', 'Gagal terhubung ke server utama.');
    } finally {
        hideWaterLoading();
    }
});

verifyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const verifyUrl = urlInput.value.trim();
    if (!verifyUrl) return;

    showWaterLoading("Memverifikasi URL...");

    try {
        const response = await fetch(`${API_VERIFY_URL}?email=${encodeURIComponent(currentEmail)}&link=${encodeURIComponent(verifyUrl)}`);
        const data = await response.json();

        if (response.ok && (data.status === true || data.code === 200 || data.success === true)) {
            resEmail.textContent = currentEmail;
            step2Container.classList.add('hidden');
            resultContainer.classList.remove('hidden');
            document.getElementById('stepIndicator').classList.add('hidden');
        } else {
            showAlert('error', 'Verifikasi Gagal', data.message || 'URL verifikasi tidak valid atau kedaluwarsa.');
        }
    } catch (error) {
        showAlert('error', 'Koneksi Terputus', 'Gagal terhubung ke server verifikasi.');
    } finally {
        hideWaterLoading();
    }
});

btnBack.addEventListener('click', () => {
    hideAlert();
    step2Container.classList.add('hidden');
    step1Container.classList.remove('hidden');
    urlInput.value = '';
    updateStepStyle(1);
});

btnReset.addEventListener('click', () => {
    hideAlert();
    resultContainer.classList.add('hidden');
    step1Container.classList.remove('hidden');
    document.getElementById('stepIndicator').classList.remove('hidden');
    emailInput.value = '';
    urlInput.value = '';
    currentEmail = '';
    updateStepStyle(1);
});
