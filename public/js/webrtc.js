let localStream;
let peers = {}; // Connection per user
let connectedUsers = []; // List of {id, name}
const socket = io();
let myRoomId = null;

async function startVideoCall(roomId, userName) {
    document.getElementById('video-room').classList.remove('hidden');
    myRoomId = roomId;

    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: {
                width: { ideal: 320, max: 640 },
                height: { ideal: 240, max: 480 },
                frameRate: { max: 15 } // 15fps ahorra mucho ancho de banda
            }
        });
        document.getElementById('local-video').srcObject = localStream;

        // Unirse a la sala socket
        socket.emit('join-room', roomId, currentUser.id, userName);

        // Chat listener
        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const text = e.target.value;
                if (!text.trim()) return;
                socket.emit('send-chat-message', roomId, { sender: userName, text });
                addChatMessage('Tú', text);
                e.target.value = '';
            }
        });

        // Initialize lists
        updateParticipantLists();

    } catch (err) {
        console.error("Error media devices", err);
        notify('No se pudo acceder a cámara/micro', 'error');
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('video-sidebar');
    const btn = document.getElementById('btn-sidebar');

    sidebar.classList.toggle('collapsed');

    // Reset alert color if opening
    if (!sidebar.classList.contains('collapsed')) {
        btn.style.background = '';
    }
}

function switchVideoTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.sidebar-content').forEach(c => c.classList.add('hidden'));

    // Find button by text content roughly or simpler logic? 
    // Let's use specific IDs or just rely on index? Text is safest here.
    const btns = document.querySelectorAll('.tab-btn');
    if (tab === 'chat') {
        btns[0].classList.add('active');
        document.getElementById('v-tab-chat').classList.remove('hidden');
    } else {
        btns[1].classList.add('active');
        document.getElementById('v-tab-participants').classList.remove('hidden');
        updateParticipantLists(); // Refresh on view
    }
}

async function shareScreen() {
    const btn = document.getElementById('btn-share');
    // Toggle check
    if (btn.classList.contains('active-screen')) {
        stopSharingScreen();
        return;
    }

    try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const videoTrack = screenStream.getVideoTracks()[0];

        // Replace track in local stream and all peer connections
        const sender = localStream.getVideoTracks()[0];
        localStream.removeTrack(sender);
        localStream.addTrack(videoTrack);

        document.getElementById('local-video').srcObject = localStream; // Show own screen

        // Replace in peers
        for (let userId in peers) {
            const pc = peers[userId];
            const sender = pc.getSenders().find(s => s.track.kind === 'video');
            if (sender) sender.replaceTrack(videoTrack);
        }

        // Handle stop sharing via browser UI
        videoTrack.onended = () => {
            stopSharingScreen();
        };

        btn.classList.add('active-screen');
        btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="red" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M21 21l-2-2m-3.268-3.268L3 3"></path></svg>`; // X icon
        btn.title = 'Dejar de Compartir';
        notify('Compartiendo pantalla', 'success');

    } catch (e) {
        console.error("Error sharing screen", e);
    }
}

async function stopSharingScreen() {
    try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = camStream.getVideoTracks()[0];

        // Replace track back to camera
        const sender = localStream.getVideoTracks()[0];
        sender.stop();
        localStream.removeTrack(sender);
        localStream.addTrack(videoTrack);

        document.getElementById('local-video').srcObject = localStream;

        for (let userId in peers) {
            const pc = peers[userId];
            const sender = pc.getSenders().find(s => s.track.kind === 'video');
            if (sender) sender.replaceTrack(videoTrack);
        }

        const btn = document.getElementById('btn-share');
        btn.classList.remove('active-screen');
        btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h20v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V3z"></path><path d="M8 21h8"></path><path d="M12 17v4"></path></svg>`;
        btn.title = 'Compartir Pantalla';

    } catch (e) { console.error(e); }
}

// MediaRecorder Logic
let mediaRecorder;
let recordedChunks = [];

async function toggleRecording() {
    const btn = document.getElementById('btn-rec');
    if (btn.classList.contains('active')) {
        // Stop
        mediaRecorder.stop();
        btn.classList.remove('active');
        notify('Procesando grabación...', 'success');

        // Wait for last data
        setTimeout(async () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const formData = new FormData();
            formData.append('video', blob, `class-recording.webm`);

            try {
                // Upload to server
                // We need courseId. It's in 'myRoomId' variable
                const token = localStorage.getItem('token');
                if (!token) {
                    notify('Error: No token found. Log in again.', 'error');
                    return;
                }

                console.log("Uploading blob size:", blob.size, "to course:", myRoomId);

                const res = await fetch(`/api/v1/courses/${myRoomId}/recordings`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }, // Standard fetch, manual header
                    body: formData
                });

                const data = await res.json();
                if (data.success) {
                    notify('✅ Grabación guardada en el servidor', 'success');
                } else {
                    console.error("Server Error:", data);
                    notify('❌ Error guardando: ' + (data.message || 'Unknown'), 'error');
                }
            } catch (e) {
                console.error("Network/Client Error:", e);
                notify('Error subiendo video: ' + e.message, 'error');
            }
        }, 1000);

    } else {
        // Start
        recordedChunks = [];
        // Capture everything (screen or camera + audio)
        // Ideally we want to record what the user sees, but mostly we record local stream or composite.
        // Simple version: record local stream
        if (!localStream) return notify('No hay stream para grabar', 'error');

        mediaRecorder = new MediaRecorder(localStream);
        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) recordedChunks.push(event.data);
        };
        mediaRecorder.start();
        btn.classList.add('active');
        notify('Grabación iniciada', 'success');
    }
}

async function updateParticipantLists() {
    const listConnected = document.getElementById('list-connected');
    const listAbsent = document.getElementById('list-absent');

    // Fetch real roster from API
    let roster = [];
    try {
        const res = await apiRequest(`/v1/courses/${myRoomId}/students`);
        roster = res.data || [];
    } catch (e) { console.error("Error fetching roster", e); }

    // Identify connected user IDs
    const onlineIds = connectedUsers.map(u => u.id); // From socket
    onlineIds.push(currentUser.id); // Add self

    listConnected.innerHTML = '';
    listAbsent.innerHTML = '';

    // Add Self to Connected
    listConnected.innerHTML += `
        <div class="participant-item">
            <div class="status-dot online"></div>
            <span>${currentUser.full_name} (Tú)</span>
        </div>
    `;

    // Process Roster
    roster.forEach(student => {
        if (student.id === currentUser.id) return; // Skip self

        // Check if online (by ID math mostly, assuming ID in socket handshake was reliable)
        // In socketHandler we emit 'user-connected' (userId, userName). userId is DB ID.
        // So we compare integers/strings carefully.
        const isOnline = onlineIds.some(id => String(id) === String(student.id));

        if (isOnline) {
            listConnected.innerHTML += `
                <div class="participant-item">
                    <div class="status-dot online"></div>
                    <span>${student.full_name}</span>
                </div>
            `;
        } else {
            listAbsent.innerHTML += `
                <div class="participant-item" style="opacity:0.5">
                    <div class="status-dot offline"></div>
                    <span>${student.full_name}</span>
                </div>
            `;
        }
    });

    // If no students in roster (e.g. Professor + Admin only, or empty class)
    if (roster.length === 0) {
        listAbsent.innerHTML = '<p style="font-size:0.8rem; color:gray; padding:0.5rem;">No hay estudiantes inscritos.</p>';
    }
}

// Socket Events
socket.on('user-connected', async (userId, userName) => {
    notify(`${userName} se ha unido`, 'success');
    connectedUsers.push({ id: userId, name: userName });
    updateParticipantLists();

    // Iniciar llamada P2P (Caller)
    const pc = createPeerConnection(userId);
    peers[userId] = pc;

    // Añadir tracks
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    // Crear oferta
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit('offer', { target: userId, caller: currentUser.id, sdp: offer });
});

socket.on('offer', async (payload) => {
    // Responder llamada (Callee)
    const pc = createPeerConnection(payload.caller);
    peers[payload.caller] = pc;

    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    await pc.setRemoteDescription(payload.sdp);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit('answer', { target: payload.caller, caller: currentUser.id, sdp: answer });
});

socket.on('answer', async (payload) => {
    const pc = peers[payload.caller]; // Aquí caller es quien envió la respuesta
    if (pc) await pc.setRemoteDescription(payload.sdp);
});

socket.on('ice-candidate', async (payload) => {
    const pc = peers[payload.caller];
    if (pc && payload.candidate) {
        try {
            await pc.addIceCandidate(payload.candidate);
        } catch (e) {
            console.error('Error adding ICE candidate', e);
        }
    }
});

socket.on('user-disconnected', (userId) => {
    if (peers[userId]) {
        peers[userId].close();
        delete peers[userId];
    }
    const idx = connectedUsers.findIndex(u => u.id === userId);
    if (idx > -1) connectedUsers.splice(idx, 1);
    updateParticipantLists();

    const vid = document.getElementById(`video-${userId}`);
    if (vid) vid.remove();
});

socket.on('chat-message', (data) => {
    addChatMessage(data.sender, data.text);
    // Beep or visual indicator?
    const btn = document.getElementById('btn-sidebar');
    if (document.getElementById('video-sidebar').classList.contains('collapsed')) {
        btn.style.background = 'var(--secondary)'; // Alert color
    }
});

// Helpers
function createPeerConnection(targetId) {
    const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', {
                target: targetId,
                caller: currentUser.id, // Add caller ID
                candidate: event.candidate
            });
        }
    };

    pc.ontrack = (event) => {
        const vidId = `video-${targetId}`;
        if (!document.getElementById(vidId)) {
            const wrapper = document.createElement('div');
            wrapper.className = 'video-wrapper';
            wrapper.id = vidId;
            const vid = document.createElement('video');
            vid.autoplay = true;
            vid.playsInline = true;
            vid.srcObject = event.streams[0];
            wrapper.appendChild(vid);
            document.getElementById('video-grid').appendChild(wrapper);

            // Add name label if possible? (not in stream, need metadata in socket)
        }
    };

    return pc;
}

function leaveRoom() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }

    // Close all peer connections
    for (let userId in peers) {
        peers[userId].close();
    }
    peers = {};
    connectedUsers = [];

    // Clear UI
    document.getElementById('video-grid').innerHTML = `
        <div class="video-wrapper">
            <video id="local-video" autoplay muted playsinline></video>
            <span class="video-label">Tú</span>
        </div>
    `;

    document.getElementById('video-room').classList.add('hidden');
    socket.emit('leave-room', myRoomId); // Inform server if needed, or disconnect handles it
}

function addChatMessage(sender, text) {
    const div = document.createElement('div');
    div.className = 'chat-msg';
    div.innerHTML = `<strong>${sender}:</strong> ${text}`;
    const container = document.getElementById('chat-messages');
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// Controls
let isMuted = false;
function toggleMute() {
    isMuted = !isMuted;
    localStream.getAudioTracks()[0].enabled = !isMuted;
    document.getElementById('btn-mute').classList.toggle('active');
}

let isVideoOff = false;
function toggleVideo() {
    isVideoOff = !isVideoOff;
    localStream.getVideoTracks()[0].enabled = !isVideoOff;
    document.getElementById('btn-video').classList.toggle('active');
}

// MediaRecorder Logic

