console.log("JS Loaded Successfully");
document.addEventListener("DOMContentLoaded", () => {

const micBtn = document.getElementById("micBtn");
const chatMicBtn = document.getElementById("chatMicBtn");
const checkBtn = document.getElementById("checkBtn");
const sendBtn = document.getElementById("sendBtn");
const accountInput = document.getElementById("accountNumber");
const amountInput = document.getElementById("amount");
const balanceDisplay = document.getElementById("balanceDisplay");
const statusMsg = document.getElementById("statusMsg");
const appRoot = document.querySelector(".app");

// Tab buttons / panels
const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");

// Schemes
const schemeType = document.getElementById("schemeType");
const loadSchemesBtn = document.getElementById("loadSchemesBtn");
const schemesList = document.getElementById("schemesList");

// Mandates
const createMandateBtn = document.getElementById("createMandateBtn");
const mandatesList = document.getElementById("mandatesList");
const mandateBeneficiary = document.getElementById("mandateBeneficiary");
const mandateVpa = document.getElementById("mandateVpa");
const mandateAmount = document.getElementById("mandateAmount");
const mandateFrequency = document.getElementById("mandateFrequency");
const mandateStartDate = document.getElementById("mandateStartDate");

// Complaints
const submitComplaintBtn = document.getElementById("submitComplaintBtn");
const complaintsList = document.getElementById("complaintsList");
const complaintCategory = document.getElementById("complaintCategory");
const complaintPriority = document.getElementById("complaintPriority");
const complaintDescription = document.getElementById("complaintDescription");
const complaintContact = document.getElementById("complaintContact");

// Requests
const submitRequestBtn = document.getElementById("submitRequestBtn");
const requestsList = document.getElementById("requestsList");
const requestType = document.getElementById("requestType");
const requestDescription = document.getElementById("requestDescription");
const requestContact = document.getElementById("requestContact");

// Re-auth modal
const reauthModal = document.getElementById("reauthModal");
const reauthPassword = document.getElementById("reauthPassword");
const reauthCancelBtn = document.getElementById("reauthCancelBtn");
const reauthConfirmBtn = document.getElementById("reauthConfirmBtn");

function setStatus(msg) {
    if (statusMsg) statusMsg.innerText = msg;
}
function speak(msg) {
    if (!msg) return;
    // Keep speech clean for elderly users: cancel previous queued audio.
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(msg);
    speech.lang = "en-US";
    window.speechSynthesis.speak(speech);
}
function stopSpeaking() {
    window.speechSynthesis.cancel();
    setStatus("Stopped speaking");
}
console.log("JS Loaded");

function setLoading(isLoading) {
    if (appRoot) appRoot.classList.toggle("loading", isLoading);
    if (checkBtn) checkBtn.disabled = isLoading;
    if (sendBtn) sendBtn.disabled = isLoading;
    if (micBtn) micBtn.disabled = isLoading;
    if (chatMicBtn) chatMicBtn.disabled = isLoading;
}

function showTab(tabId) {
    if (!tabPanels || !tabButtons) return;
    tabPanels.forEach((p) => {
        p.classList.toggle("active", p.id === tabId);
    });
    tabButtons.forEach((b) => {
        const active = b.getAttribute("data-tab") === tabId;
        b.classList.toggle("active", active);
        b.setAttribute("aria-selected", active ? "true" : "false");
    });

    // Lazy-load content per tab.
    if (tabId === "tab-schemes") loadSchemes?.();
    if (tabId === "tab-mandates") loadMandates?.();
    if (tabId === "tab-complaints") loadComplaints?.();
    if (tabId === "tab-requests") loadServiceRequests?.();
}

tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        showTab(btn.getAttribute("data-tab"));
    });
});

function renderItems(container, items, renderFn) {
    if (!container) return;
    container.innerHTML = "";
    (items || []).forEach((item) => {
        const el = document.createElement("div");
        el.className = "item";
        el.innerHTML = renderFn(item);
        container.appendChild(el);
    });
}

async function postJson(url, payload) {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    let data;
    try {
        data = await res.json();
    } catch {
        data = { status: "error", message: "Invalid server response" };
    }
    if (!res.ok && data?.message == null) {
        data = { status: "error", message: `Request failed (${res.status})` };
    }
    return data;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function openChatbotBestEffort() {
    const launchSelectors = [
        "[class*='cxg'][class*='button']",
        "[class*='cxgenie'][class*='button']",
        "button[aria-label*='chat' i]",
        "button[title*='chat' i]",
    ];

    for (const sel of launchSelectors) {
        const btn = document.querySelector(sel);
        if (btn) {
            btn.click();
            return true;
        }
    }
    return false;
}

function findChatInputBestEffort() {
    const inputSelectors = [
        "textarea[placeholder*='Type' i]",
        "textarea[placeholder*='message' i]",
        "input[placeholder*='Type' i]",
        "input[placeholder*='message' i]",
        "[contenteditable='true']",
    ];
    for (const sel of inputSelectors) {
        const el = document.querySelector(sel);
        if (el && el.offsetParent !== null) return el;
    }
    return null;
}

function findChatSendButtonBestEffort() {
    const btnSelectors = [
        "button[aria-label*='send' i]",
        "button[title*='send' i]",
        "button[class*='send' i]",
        "[role='button'][aria-label*='send' i]",
    ];
    for (const sel of btnSelectors) {
        const btn = document.querySelector(sel);
        if (btn && btn.offsetParent !== null) return btn;
    }
    return null;
}

async function sendMessageToChatbotBestEffort(message) {
    if (!message) return false;
    openChatbotBestEffort();
    await sleep(350);

    const input = findChatInputBestEffort();
    if (!input) {
        setStatus("Couldn't find chatbot input. Please type in the chat box.");
        return false;
    }

    if (input.tagName === "TEXTAREA" || input.tagName === "INPUT") {
        input.focus();
        input.value = message;
        input.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
        input.focus();
        input.textContent = message;
        input.dispatchEvent(new Event("input", { bubbles: true }));
    }

    const sendBtn = findChatSendButtonBestEffort();
    if (sendBtn) {
        sendBtn.click();
        return true;
    }

    // Fallback: press Enter
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", bubbles: true }));
    return true;
}

const readAloudCache = new Set();
function maybeSpeakChatReply(text) {
    const clean = (text || "").trim().replace(/\s+/g, " ");
    if (clean.length < 8 || clean.length > 260) return;
    if (readAloudCache.has(clean)) return;
    readAloudCache.add(clean);
    setStatus(`Chatbot: ${clean}`);
    speak(clean);
}

function startChatReplyObserver() {
    if (!document.body || window.__chatReplyObserverInstalled) return;
    window.__chatReplyObserverInstalled = true;

    const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
            m.addedNodes.forEach((node) => {
                if (!(node instanceof HTMLElement)) return;
                const cls = (node.className || "").toString().toLowerCase();
                const txt = (node.innerText || "").trim();
                if (
                    cls.includes("bot") ||
                    cls.includes("message") ||
                    cls.includes("cxg") ||
                    cls.includes("cxgenie")
                ) {
                    maybeSpeakChatReply(txt);
                }
            });
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

function startOneShotRecognition(onText, onError) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
        onError?.("Speech recognition not supported in this browser");
        return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;

    rec.onresult = (event) => {
        const text = getTranscriptFromResult(event).trim();
        onText?.(text);
    };
    rec.onerror = (event) => onError?.(speechErrorMessage(event.error));
    rec.start();
}

async function loadSchemes() {
    if (!schemesList) return;
    if (!schemeType) return;

    setStatus("Loading schemes…");
    try {
        const res = await fetch("/schemes", { method: "GET" });
        const data = await res.json();
        if (!data || data.status !== "success") {
            setStatus(data?.message ?? "Failed to load schemes");
            return;
        }

        const type = schemeType.value === "fd" ? "fd" : "loans";
        const items = (data.schemes && data.schemes[type]) ? data.schemes[type] : [];

        renderItems(schemesList, items, (item) => {
            const title = item.name || item.title || "Scheme";
            const sub =
                item.roi ? `ROI: ${item.roi}` :
                item.interest_range ? `Interest: ${item.interest_range}` :
                "";

            const extraParts = [];
            if (item.tenure) extraParts.push(`Tenure: ${item.tenure}`);
            if (item.min_investment) extraParts.push(`Min: ${item.min_investment}`);
            if (item.eligibility) extraParts.push(`Eligibility: ${item.eligibility}`);
            if (item.documents) extraParts.push(`Docs: ${(item.documents || []).slice(0, 3).join(", ")}${item.documents.length > 3 ? "…" : ""}`);
            if (item.features) extraParts.push(`Features: ${(item.features || []).slice(0, 3).join(", ")}${item.features.length > 3 ? "…" : ""}`);

            return `
                <div style="font-weight:900;margin-bottom:6px;">${title}</div>
                ${sub ? `<div style="opacity:0.9;margin-bottom:6px;">${sub}</div>` : ""}
                ${extraParts.length ? `<div style="opacity:0.85;">${extraParts.join("<br/>")}</div>` : ""}
            `;
        });
        setStatus("Schemes updated");
    } catch (e) {
        setStatus("Could not load schemes");
        console.error(e);
    }
}

async function loadMandates() {
    if (!mandatesList) return;
    try {
        const res = await fetch("/mandates", { method: "GET" });
        const data = await res.json();
        if (!data || data.status !== "success") {
            setStatus(data?.message ?? "Failed to load mandates");
            return;
        }
        renderItems(mandatesList, data.mandates || [], (m) => {
            return `
                <div style="font-weight:900;margin-bottom:6px;">${m.id || "Mandate"}</div>
                <div style="opacity:0.9;">${m.beneficiary || ""} ${m.vpa ? `(${m.vpa})` : ""}</div>
                <div style="opacity:0.85;margin-top:6px;">Amount: ₹${m.amount ?? ""} • ${m.frequency ?? ""}</div>
                <div style="opacity:0.75;margin-top:4px;">Start: ${m.start_date ?? ""} • Status: ${m.status ?? ""}</div>
            `;
        });
    } catch (e) {
        console.error(e);
    }
}

async function loadComplaints() {
    if (!complaintsList) return;
    try {
        const res = await fetch("/complaints", { method: "GET" });
        const data = await res.json();
        if (!data || data.status !== "success") {
            setStatus(data?.message ?? "Failed to load complaints");
            return;
        }
        renderItems(complaintsList, data.complaints || [], (c) => {
            return `
                <div style="font-weight:900;margin-bottom:6px;">${c.id || "Complaint"}</div>
                <div style="opacity:0.9;">${c.category || ""} • Priority: ${c.priority || ""}</div>
                <div style="opacity:0.85;margin-top:6px;">${(c.description || "").slice(0, 120)}${(c.description || "").length > 120 ? "…" : ""}</div>
                <div style="opacity:0.75;margin-top:4px;">Contact: ${c.contact || ""} • Status: ${c.status || ""}</div>
            `;
        });
    } catch (e) {
        console.error(e);
    }
}

async function loadServiceRequests() {
    if (!requestsList) return;
    try {
        const res = await fetch("/service_requests", { method: "GET" });
        const data = await res.json();
        if (!data || data.status !== "success") {
            setStatus(data?.message ?? "Failed to load requests");
            return;
        }
        renderItems(requestsList, data.service_requests || [], (r) => {
            return `
                <div style="font-weight:900;margin-bottom:6px;">${r.id || "Request"}</div>
                <div style="opacity:0.9;">${r.type || ""} • Status: ${r.status || ""}</div>
                <div style="opacity:0.85;margin-top:6px;">${(r.description || "").slice(0, 120)}${(r.description || "").length > 120 ? "…" : ""}</div>
                <div style="opacity:0.75;margin-top:4px;">Contact: ${r.contact || ""}</div>
            `;
        });
    } catch (e) {
        console.error(e);
    }
}

function openReauthModal() {
    if (!reauthModal) return Promise.resolve(false);
    if (!reauthPassword) return Promise.resolve(false);

    reauthPassword.value = "";
    reauthModal.classList.add("show");

    return new Promise((resolve) => {
        const cleanup = () => {
            reauthConfirmBtn?.removeEventListener("click", onConfirm);
            reauthCancelBtn?.removeEventListener("click", onCancel);
            document.removeEventListener("keydown", onKeyDown);
        };

        const onConfirm = async () => {
            const password = (reauthPassword?.value || "").trim();
            if (!password) {
                setStatus("Enter password to verify");
                speak("Enter password to verify");
                return;
            }
            setStatus("Verifying…");

            try {
                const data = await postJson("/reauth", { password });
                if (data.status === "success") {
                    reauthModal.classList.remove("show");
                    cleanup();
                    resolve(true);
                    return;
                }
                setStatus(data.message ?? "Verification failed");
            } catch (e) {
                setStatus("Verification failed (network error)");
                console.error(e);
            }
        };

        const onCancel = () => {
            reauthModal.classList.remove("show");
            cleanup();
            resolve(false);
        };

        const onKeyDown = (ev) => {
            if (ev.key === "Escape") onCancel();
        };

        reauthConfirmBtn?.addEventListener("click", onConfirm);
        reauthCancelBtn?.addEventListener("click", onCancel);
        document.addEventListener("keydown", onKeyDown);
        reauthPassword?.focus?.();
    });
}

if (loadSchemesBtn) loadSchemesBtn.onclick = loadSchemes;
if (createMandateBtn) {
    createMandateBtn.onclick = async () => {
        setStatus("Creating mandate…");
        try {
            const payload = {
                beneficiary: mandateBeneficiary?.value ?? "",
                vpa: mandateVpa?.value ?? "",
                amount: Number(mandateAmount?.value ?? 0),
                frequency: mandateFrequency?.value ?? "Monthly",
                start_date: mandateStartDate?.value ?? "",
            };
            if (!payload.vpa) {
                setStatus("Enter VPA first");
                return;
            }
            if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
                setStatus("Enter a valid amount");
                return;
            }
            const data = await postJson("/mandates", payload);
            if (data.status === "success") {
                setStatus("Mandate created");
                await loadMandates();
            } else {
                setStatus(data.message ?? "Failed to create mandate");
            }
        } catch (e) {
            setStatus("Failed to create mandate");
            console.error(e);
        }
    };
}

if (submitComplaintBtn) {
    submitComplaintBtn.onclick = async () => {
        setStatus("Submitting complaint…");
        try {
            const payload = {
                category: complaintCategory?.value ?? "General",
                priority: complaintPriority?.value ?? "Normal",
                description: complaintDescription?.value ?? "",
                contact: complaintContact?.value ?? "",
            };
            if (!payload.description.trim()) {
                setStatus("Write complaint description first");
                return;
            }
            const data = await postJson("/complaints", payload);
            if (data.status === "success") {
                setStatus("Complaint submitted");
                await loadComplaints();
            } else {
                setStatus(data.message ?? "Failed to submit complaint");
            }
        } catch (e) {
            setStatus("Failed to submit complaint");
            console.error(e);
        }
    };
}

if (submitRequestBtn) {
    submitRequestBtn.onclick = async () => {
        setStatus("Creating service request…");
        try {
            const payload = {
                type: requestType?.value ?? "General Request",
                description: requestDescription?.value ?? "",
                contact: requestContact?.value ?? "",
            };
            if (!payload.description.trim()) {
                setStatus("Add request description first");
                return;
            }
            const data = await postJson("/service_requests", payload);
            if (data.status === "success") {
                setStatus("Service request created");
                await loadServiceRequests();
            } else {
                setStatus(data.message ?? "Failed to create request");
            }
        } catch (e) {
            setStatus("Failed to create request");
            console.error(e);
        }
    };
}

// Schemes load happens on button click / voice command.

function getAccountNumber() {
    return (accountInput?.value ?? "").trim();
}

function getAmount() {
    const raw = (amountInput?.value ?? "").trim();
    const num = Number(raw);
    if (!Number.isFinite(num) || num <= 0) return null;
    return num;
}

function setAccountNumber(value) {
    if (!accountInput) return;
    accountInput.value = String(value ?? "").trim();
}

function setAmount(value) {
    if (!amountInput) return;
    const num = Number(value);
    amountInput.value = Number.isFinite(num) ? String(num) : String(value ?? "").trim();
}

function normalizeDigits(text) {
    // Extract digits from speech like: "12 34 56", "1,000", "account number is 123..."
    const digitsOnly = (text || "").replace(/[^\d]/g, "");
    return digitsOnly;
}

function extractFirstNumber(text) {
    // Supports: "500", "500.50", "1,000"
    const m = (text || "").match(/(\d[\d,]*)(?:\.(\d+))?/);
    if (!m) return null;
    const whole = (m[1] || "").replace(/,/g, "");
    const frac = m[2];
    const num = Number(frac ? `${whole}.${frac}` : whole);
    return Number.isFinite(num) ? num : null;
}

function parseVoiceIntent(rawText) {
    const text = (rawText || "").toLowerCase().trim();

    if (/\b(stop speaking|stop voice|mute voice|silent)\b/.test(text)) return { type: "stop_speaking" };
    if (/\b(open chatbot|open chat|chatbot open|open genie)\b/.test(text)) return { type: "open_chatbot" };
    if (/\b(submit complaint|send complaint|raise complaint now)\b/.test(text)) return { type: "submit_complaint" };

    const askMatch = text.match(/\bask chatbot\b[:\s-]*(.+)$/);
    if (askMatch && askMatch[1]) return { type: "ask_chatbot", message: askMatch[1].trim() };

    const complaintDictation = text.match(/\b(complain|complaint)(?:\s+that|\s+about)?\s+(.+)$/);
    if (complaintDictation && complaintDictation[2]) {
        return { type: "dictate_complaint", text: complaintDictation[2].trim() };
    }

    // Simple commands
    if (/(^|\b)(check( my)? )?balance\b/.test(text)) return { type: "check_balance" };

    // Schemes (FD/loans)
    if (/\b(schemes)\b/.test(text) || /\b(fd|fixed deposit|fixeddeposit)\b/.test(text) || /\b(loan|loans)\b/.test(text)) {
        if (/\b(fd|fixed deposit|fixeddeposit)\b/.test(text)) return { type: "open_schemes", scheme: "fd" };
        if (/\b(loan|loans)\b/.test(text)) return { type: "open_schemes", scheme: "loans" };
        return { type: "open_schemes" };
    }

    // Complaints
    if (/\b(complaint|raise complaint|lod?ge complaint)\b/.test(text)) return { type: "open_complaints" };

    // Service requests
    if (/\b(service request|service requests|request)\b/.test(text) && !/\b(check|send|transfer)\b/.test(text)) {
        return { type: "open_requests" };
    }

    // UPI Mandates
    if (/\b(upi mandate|mandate)\b/.test(text)) return { type: "open_mandates" };

    // Combined: "send 500 to account 1234567890"
    if (/\b(send|transfer)\b/.test(text) && /\bto\b/.test(text) && /\b(account|acct)\b/.test(text)) {
        const amount = extractFirstNumber(text);
        const digits = normalizeDigits(text);
        const account = digits.length >= 10 ? digits.slice(-10) : digits;
        const intent = { type: "send_with_details" };
        if (amount != null) intent.amount = amount;
        if (account && account.length >= 6) intent.account = account;
        return intent;
    }

    // Plain "send" / "transfer" (also supports "send 500")
    if (/\b(send|transfer)\b/.test(text)) {
        const amount = extractFirstNumber(text); // optional
        const intent = { type: "send_money" };
        if (amount != null) intent.amount = amount;
        return intent;
    }

    // Fill fields
    if (/\b(account|acc)\b/.test(text) && /\b(number|no)\b/.test(text)) {
        const digits = normalizeDigits(text);
        if (digits.length >= 6) return { type: "set_account", account: digits };
    }
    if (/\bamount\b/.test(text)) {
        const num = extractFirstNumber(text);
        if (num != null) return { type: "set_amount", amount: num };
    }

    // Fill / set complaint category hints (lightweight)
    if (/\b(urgent|high priority)\b/.test(text) && /\b(complaint|issue)\b/.test(text)) {
        return { type: "open_complaints", priority: "Urgent" };
    }

    return { type: "unknown", text };
}

let recognition;
let speechListening = false;

if (window.SpeechRecognition || window.webkitSpeechRecognition) {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;
}

function getTranscriptFromResult(event) {
    let text = "";
    for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
    }
    return text.trim();
}

function speechErrorMessage(code) {
    const map = {
        "not-allowed": "Microphone blocked. Click the lock icon in the address bar and allow the microphone.",
        "service-not-allowed": "Speech service not allowed. Check browser permissions or try Chrome/Edge.",
        "audio-capture": "No microphone found or it is in use by another app.",
        "no-speech": "No speech detected. Speak right after clicking, or speak louder.",
        network: "Speech recognition needs internet (Chrome uses Google). Check your connection.",
        aborted: "Listening stopped.",
        "bad-grammar": "Speech recognition error. Try again.",
    };
    return map[code] || `Voice error: ${code}`;
}

startChatReplyObserver();

if (chatMicBtn) {
    chatMicBtn.onclick = async () => {
        try {
            if (navigator.mediaDevices?.getUserMedia) {
                await navigator.mediaDevices.getUserMedia({ audio: true });
            }
        } catch (e) {
            setStatus("Allow microphone access to speak with chatbot.");
            return;
        }

        setStatus("Listening for chatbot message…");
        chatMicBtn.classList.add("active");
        startOneShotRecognition(
            async (text) => {
                chatMicBtn.classList.remove("active");
                if (!text) {
                    setStatus("I could not hear your chatbot question.");
                    return;
                }
                const ok = await sendMessageToChatbotBestEffort(text);
                if (ok) {
                    setStatus(`Sent to chatbot: "${text}"`);
                }
            },
            (msg) => {
                chatMicBtn.classList.remove("active");
                setStatus(msg || "Could not capture chatbot voice input");
            }
        );
    };
}

if (micBtn && recognition) {
    micBtn.onclick = async () => {
        try {
            if (navigator.mediaDevices?.getUserMedia) {
                await navigator.mediaDevices.getUserMedia({ audio: true });
            }
        } catch (e) {
            setStatus("Allow microphone access for this site (browser address bar → site settings).");
            console.warn(e);
            return;
        }

        setStatus('Listening… try "check balance", "send", "complain ...", "open chatbot", "ask chatbot ...", or "stop speaking".');
        micBtn.classList.add("active");

        try {
            if (speechListening) {
                recognition.stop();
            }
            recognition.start();
            speechListening = true;
        } catch (e) {
            if (e.name === "InvalidStateError") {
                try {
                    recognition.abort();
                } catch (_) {}
                setTimeout(() => {
                    try {
                        recognition.start();
                        speechListening = true;
                    } catch (e2) {
                        setStatus("Could not start voice. Try again in a moment.");
                        console.warn(e2);
                        micBtn.classList.remove("active");
                        speechListening = false;
                    }
                }, 100);
            } else {
                setStatus("Could not start voice recognition.");
                console.warn(e);
                micBtn.classList.remove("active");
                speechListening = false;
            }
        }
    };

    recognition.onstart = () => {
        speechListening = true;
    };

    recognition.onresult = (event) => {
        const text = getTranscriptFromResult(event).toLowerCase();
        if (!text) {
            setStatus("Did not catch that. Try again and say balance or send.");
            return;
        }

        const intent = parseVoiceIntent(text);

        if (intent.type === "stop_speaking") {
            stopSpeaking();
            return;
        }

        if (intent.type === "open_chatbot") {
            const opened = openChatbotBestEffort();
            if (opened) {
                setStatus("Opened chatbot");
                speak("Opened chatbot");
            } else {
                setStatus("I could not auto-open chatbot. Please tap the chat bubble.");
            }
            return;
        }

        if (intent.type === "ask_chatbot") {
            openChatbotBestEffort();
            sendMessageToChatbotBestEffort(intent.message).then((ok) => {
                if (ok) {
                    setStatus(`Sent to chatbot: "${intent.message}"`);
                } else {
                    setStatus("Could not send to chatbot automatically.");
                }
            });
            return;
        }

        if (intent.type === "dictate_complaint") {
            showTab("tab-complaints");
            if (complaintDescription) {
                complaintDescription.value = intent.text;
                complaintDescription.dispatchEvent(new Event("input", { bubbles: true }));
            }
            setStatus("Complaint text added. Say 'submit complaint' or click submit.");
            speak("I have written your complaint.");
            return;
        }

        if (intent.type === "submit_complaint") {
            showTab("tab-complaints");
            submitComplaintBtn?.click?.();
            return;
        }

        if (intent.type === "set_account") {
            setAccountNumber(intent.account);
            setStatus(`Account number filled: ${intent.account}`);
            speak("Account number filled");
            amountInput?.focus?.();
            return;
        }

        if (intent.type === "set_amount") {
            setAmount(intent.amount);
            setStatus(`Amount filled: ₹${intent.amount}`);
            speak("Amount filled");
            sendBtn?.focus?.();
            return;
        }

        if (intent.type === "send_with_details") {
            if (intent.account) setAccountNumber(intent.account);
            if (intent.amount != null) setAmount(intent.amount);
            setStatus("Details filled. Sending now…");
            speak("Sending now");
            sendBtn?.click?.();
            return;
        }

        if (intent.type === "check_balance") {
            if (!getAccountNumber()) {
                setStatus("Say: account number 1234567890");
                speak("Please say your account number");
                accountInput?.focus?.();
            } else {
                setStatus("Checking balance…");
                speak("Checking balance");
                checkBtn?.click?.();
            }
            return;
        }

        if (intent.type === "send_money") {
            // If user said "send 500", use it to fill amount automatically.
            if (intent.amount != null) setAmount(intent.amount);

            if (!getAccountNumber()) {
                setStatus("Say: account number 1234567890");
                speak("Please say your account number");
                accountInput?.focus?.();
                return;
            }
            if (getAmount() == null) {
                setStatus("Say: amount 500");
                speak("Please say the amount");
                amountInput?.focus?.();
                return;
            }
            setStatus("Sending money…");
            speak("Sending money");
            sendBtn?.click?.();
            return;
        }

        if (intent.type === "open_schemes") {
            showTab("tab-schemes");
            if (schemeType) {
                if (intent.scheme) schemeType.value = intent.scheme;
                else if (text.includes("fd") || text.includes("fixed deposit")) schemeType.value = "fd";
                else if (text.includes("loan") || text.includes("loans")) schemeType.value = "loans";
            }
            loadSchemes?.();
            setStatus("Opening schemes");
            speak("Opening schemes");
            return;
        }

        if (intent.type === "open_complaints") {
            showTab("tab-complaints");

            // Light hints for category/priority from speech text.
            if (complaintPriority && (intent.priority || text.includes("urgent") || text.includes("high"))) {
                if (intent.priority) complaintPriority.value = intent.priority;
                else if (text.includes("urgent")) complaintPriority.value = "Urgent";
                else if (text.includes("high")) complaintPriority.value = "High";
            }

            if (complaintCategory) {
                let cat = "General";
                if (text.includes("debit")) cat = "Debit Card";
                else if (text.includes("upi")) cat = "UPI Issue";
                else if (text.includes("app")) cat = "App Issue";
                else if (text.includes("loan")) cat = "Loan Related";
                complaintCategory.value = cat;
            }

            // If user says contact digits, try to fill contact.
            const digits = normalizeDigits(text);
            if (complaintContact && digits.length >= 10) {
                complaintContact.value = digits.slice(-10);
            }

            setStatus("Opened complaints. Fill description and submit.");
            speak("Opened complaints. Fill description and submit.");
            return;
        }

        if (intent.type === "open_mandates") {
            showTab("tab-mandates");

            // Optional hints
            const amt = extractFirstNumber(text);
            if (mandateAmount && amt != null) mandateAmount.value = String(amt);

            if (mandateFrequency) {
                if (text.includes("daily")) mandateFrequency.value = "Daily";
                else if (text.includes("weekly")) mandateFrequency.value = "Weekly";
                else if (text.includes("monthly")) mandateFrequency.value = "Monthly";
            }

            setStatus("Opened UPI mandates. Add VPA and amount, then create.");
            speak("Opened UPI mandates.");
            return;
        }

        if (intent.type === "open_requests") {
            showTab("tab-requests");

            if (requestType) {
                let type = "Service Request";
                if (text.includes("debit card")) type = "Debit card issue";
                else if (text.includes("upi")) type = "UPI issue";
                else if (text.includes("app")) type = "App issue";
                else if (text.includes("loan")) type = "Loan related";
                requestType.value = type;
            }

            setStatus("Opened service requests. Fill description and submit.");
            speak("Opened service requests.");
            return;
        }

        // Fallback: ask assistant from backend keyword knowledge.
        setStatus("Thinking…");
        postJson("/ask", { question: text })
            .then((data) => {
                const ans = data?.answer ?? "Sorry, I couldn't help with that.";
                setStatus(ans);
                speak(ans);
            })
            .catch((e) => {
                console.error(e);
                setStatus(`Heard: "${text}". Try: "FD schemes", "raise complaint", "service request".`);
            });
    };

    recognition.onerror = (event) => {
        speechListening = false;
        micBtn.classList.remove("active");
        const msg = speechErrorMessage(event.error);
        setStatus(msg);
        console.warn("SpeechRecognition error:", event.error, event);
    };

    recognition.onnomatch = () => {
        setStatus("Could not understand. Say balance or send clearly.");
    };

    recognition.onend = () => {
        speechListening = false;
        micBtn.classList.remove("active");
    };
} else if (micBtn) {
    micBtn.style.opacity = "0.6";
    micBtn.title = "Speech recognition not supported in this browser";
}
if (checkBtn) {
    checkBtn.onclick = async () => {
        console.log("Check clicked");

        const accNumber = getAccountNumber();

        if (!accNumber) {
            setStatus("Enter account number");
            accountInput?.focus?.();
            return;
        }

        setLoading(true);
        setStatus("Checking balance...");
        try {
            const data = await postJson("/check_balance", { account_number: accNumber });
            if (data.status === "success") {
                if (balanceDisplay) balanceDisplay.innerText = `₹ ${data.balance}`;
                setStatus("Balance updated");
                speak(`Your balance is ${data.balance}`);
            } else {
                setStatus(data.message ?? "Something went wrong");
            }
        } catch (e) {
            setStatus("Network error. Please try again.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
}
if (sendBtn) {
    sendBtn.onclick = async () => {
        console.log("Send clicked");
        const accNumber = getAccountNumber();
        const amount = getAmount();
        if (!accNumber) {
            setStatus("Enter account number");
            accountInput?.focus?.();
            return;
        }
        if (amount == null) {
            setStatus("Enter account number and amount");
            amountInput?.focus?.();
            return;
        }

        const verified = await openReauthModal();
        if (!verified) {
            setStatus("Verification cancelled");
            return;
        }

        setLoading(true);
        setStatus("Processing...");
        try {
            const data = await postJson("/send_money", { account_number: accNumber, amount });
            const msg = data.message ?? "Done";
            setStatus(msg);
            speak(msg);
        } catch (e) {
            setStatus("Network error. Please try again.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
}

});