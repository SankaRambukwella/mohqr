// Script.js (Frontend - JavaScript)

const reader = new Html5Qrcode("reader");
let scannedRef = null;

// --- QR Scanner Setup ---
const config = {
    fps: 10,
    qrbox: {width: 250, height: 250},
    rememberCamera: true,
    supportedScanTypes: [Html5QrcodeScanType.QR_CODE]
};

function startScanning() {
    document.getElementById('status-message').textContent = "කරුණාකර QR කේතය ස්කෑන් කරන්න...";
    document.getElementById('details-area').style.display = 'none';
    document.getElementById('reset-button').style.display = 'none';
    
    // QR කේතය ස්කෑන් කිරීමේදී ක්‍රියාත්මක වන callback function එක
    const onScanSuccess = (decodedText, decodedResult) => {
        console.log(`Code matched = ${decodedText}`);
        scannedRef = decodedText;
        reader.stop(); // ස්කෑනිම නතර කරන්න
        fetchDetails(scannedRef);
    };
    
    // ස්කෑනිමේදී ඇතිවන දෝෂ
    const onScanFailure = (error) => {
        console.warn(`Code scan error = ${error}`);
    };

    reader.start(config.facingMode, config, onScanSuccess, onScanFailure)
        .catch(err => {
            document.getElementById('status-message').textContent = "QR Scanner ආරම්භ කිරීමට අපොහොසත් විය. (කැමරාවට අවසර තිබේදැයි බලන්න)";
            console.error("Unable to start scanning", err);
        });
}

// --- Data Fetching and Processing ---

/**
 * ස්කෑන් කරන ලද Booking Ref එක භාවිතයෙන් විස්තර ලබා ගනී.
 * @param {string} ref - ස්කෑන් කරන ලද Booking Ref.
 */
function fetchDetails(ref) {
    document.getElementById('status-message').textContent = "තොරතුරු පරීක්ෂා කෙරේ...";
    
    google.script.run
        .withSuccessHandler(displayDetails)
        .withFailureHandler(handleError)
        .getVehicleDetails(ref);
}

/**
 * තොරතුරු UI එකේ පෙන්වයි.
 * @param {object} response - GAS වෙතින් ලැබෙන ප්‍රතිචාරය.
 */
function displayDetails(response) {
    if (response.success) {
        document.getElementById('status-message').textContent = `Ref: ${response.bookingRef} සොයාගන්නා ලදී.`;
        document.getElementById('disp-ref').textContent = response.bookingRef;
        document.getElementById('disp-vehicle').textContent = response.vehicle;
        document.getElementById('disp-password').textContent = response.password;
        document.getElementById('disp-in-time').textContent = response.inTime;
        document.getElementById('disp-out-time').textContent = response.outTime;
        
        document.getElementById('scanner-area').style.display = 'none';
        document.getElementById('details-area').style.display = 'block';
        document.getElementById('reset-button').style.display = 'block';
    } else {
        alert(`Error: ${response.message}`);
        document.getElementById('status-message').textContent = `දෝෂය: ${response.message}`;
        resetApp(); // දෝෂයක් ඇත්නම් යළි ආරම්භ කරන්න
    }
}

/**
 * වේලාවන් වාර්තා කිරීම සඳහා GAS වෙත දත්ත යවයි.
 * @param {string} action - 'IN' හෝ 'OUT'.
 */
function recordTime(action) {
    const manualTimeInput = document.getElementById('manual-time').value;
    
    // වේලාව නිකරුණේ යැවීමෙන් වලකින්න
    const timeToSend = manualTimeInput.trim() !== "" ? manualTimeInput.trim() : null;

    document.getElementById('result-message').textContent = `${action} වේලාව වාර්තා කිරීම ආරම්භ විය...`;
    
    google.script.run
        .withSuccessHandler((response) => {
            if (response.success) {
                alert(response.message);
                document.getElementById('result-message').textContent = `සාර්ථකයි: ${response.message}`;
                // වාර්තා කිරීමෙන් පසු විස්තර නැවත පෙන්වීමට යාවත්කාලීන කරන්න
                fetchDetails(scannedRef); 
            } else {
                alert(`Failure: ${response.message}`);
                document.getElementById('result-message').textContent = `අසාර්ථකයි: ${response.message}`;
            }
        })
        .withFailureHandler(handleError)
        .processScan(scannedRef, action, timeToSend);
}

// --- Error Handling and Reset ---

function handleError(error) {
    alert('Backend Error: ' + error.message);
    document.getElementById('status-message').textContent = "Backend දෝෂයක් ඇති විය. විස්තර සඳහා Console බලන්න.";
    resetApp();
}

function resetApp() {
    scannedRef = null;
    reader.clearCanvas();
    document.getElementById('details-area').style.display = 'none';
    document.getElementById('scanner-area').style.display = 'block';
    document.getElementById('result-message').textContent = '';
    startScanning(); // ස්කෑනිම නැවත ආරම්භ කරන්න
}

// යෙදුම පූරණය වන විට ස්කෑනිම ආරම්භ කරන්න
window.onload = startScanning;