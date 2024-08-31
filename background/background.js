let model;

async function loadModel() {
    model = await tf.loadLayersModel(browser.runtime.getURL('ml/phishing_model.json'));
}

async function predictPhishing(urlFeatures) {
    if (!model) await loadModel();

    const inputTensor = tf.tensor2d([urlFeatures]);
    const prediction = model.predict(inputTensor);
    const result = await prediction.data();

    return result[0] > 0.5;  // Assuming binary classification
}

function extractFeatures(url) {
    // Implement feature extraction logic for the URL
    // For simplicity, here's a dummy implementation:
    return [
        url.length,
        url.includes("https") ? 1 : 0,
        (url.match(/[\d-]/g) || []).length
    ];
}

chrome.webRequest.onBeforeRequest.addListener(
    async function(details) {
        const urlFeatures = extractFeatures(details.url);
        const isPhishing = await predictPhishing(urlFeatures);

        if (isPhishing) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon.png',
                title: 'Phishing Alert!',
                message: `The URL ${details.url} is potentially dangerous.`
            });
            return { cancel: true };
        }
    },
    { urls: ["<all_urls>"] },
    ["blocking"]
);
