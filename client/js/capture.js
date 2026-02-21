/**
 * Capture screen, camera and microphone; send frames as base64 over sendMedia callback.
 */

const SCREEN_FPS = 2;
const CAMERA_FPS = 5;
const AUDIO_CHUNK_MS = 200;

let screenStream = null;
let cameraStream = null;
let audioStream = null;
let screenCanvas = null;
let screenCtx = null;
let screenVideo = null;
let cameraVideo = null;
let mediaRecorder = null;
let screenInterval = null;
let cameraInterval = null;

function drawVideoToCanvas(video, canvas, ctx) {
  if (!ctx || !canvas || !video || video.readyState < 2) return;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
}

function captureScreenFrame(sendMedia) {
  if (!screenCanvas || !screenVideo || !sendMedia) return;
  drawVideoToCanvas(screenVideo, screenCanvas, screenCtx);
  try {
    const dataUrl = screenCanvas.toDataURL('image/jpeg', 0.6);
    const base64 = dataUrl.split(',')[1] || '';
    sendMedia('screen', base64, 'image/jpeg');
  } catch (e) {
    console.warn('Screen capture error:', e);
  }
}

function captureCameraFrame(sendMedia) {
  if (!cameraVideo || !sendMedia) return;
  const canvas = document.createElement('canvas');
  canvas.width = cameraVideo.videoWidth;
  canvas.height = cameraVideo.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);
  try {
    const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
    const base64 = dataUrl.split(',')[1] || '';
    sendMedia('camera', base64, 'image/jpeg');
  } catch (e) {
    console.warn('Camera capture error:', e);
  }
}

/**
 * Get screen stream: prefer Electron desktopCapturer (no permission dialog), else getDisplayMedia.
 * getScreenSourceId: async () => string | null - from electronAPI.getScreenSourceId
 */
export async function startScreenCapture(sendMedia, getScreenSourceId) {
  if (screenInterval) return;
  try {
    let stream = null;
    if (typeof getScreenSourceId === 'function') {
      try {
        const sourceId = await getScreenSourceId();
        if (sourceId) {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: sourceId,
              },
            },
          });
        }
      } catch (desktopErr) {
        console.warn('Desktop capture via Electron failed, falling back:', desktopErr);
      }
    }
    if (!stream) {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: SCREEN_FPS } },
        audio: false,
      });
    }
    if (!stream) return;
    screenStream = stream;
  } catch (e) {
    console.warn('Screen capture not available:', e);
    return;
  }
  screenVideo = document.createElement('video');
  screenVideo.srcObject = screenStream;
  screenVideo.play();
  screenCanvas = document.createElement('canvas');
  screenCanvas.width = 960;
  screenCanvas.height = 540;
  screenCtx = screenCanvas.getContext('2d');

  screenVideo.onloadedmetadata = () => {
    screenCanvas.width = Math.min(screenVideo.videoWidth, 960);
    screenCanvas.height = Math.min(screenVideo.videoHeight, 540);
  };

  const startScreenInterval = () => {
    if (screenInterval) return;
    screenInterval = setInterval(() => {
      captureScreenFrame(sendMedia);
    }, 1000 / SCREEN_FPS);
  };
  screenVideo.onloadeddata = startScreenInterval;
  if (screenVideo.readyState >= 2) startScreenInterval();
}

export async function startCameraCapture(sendMedia) {
  if (cameraInterval) return;
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, frameRate: { ideal: CAMERA_FPS } },
      audio: false,
    });
  } catch (e) {
    console.warn('Camera not available:', e);
    return;
  }
  cameraVideo = document.createElement('video');
  cameraVideo.srcObject = cameraStream;
  cameraVideo.play();
  cameraInterval = setInterval(() => {
    captureCameraFrame(sendMedia);
  }, 1000 / CAMERA_FPS);
}

export async function startAudioCapture(sendMedia) {
  if (mediaRecorder) return;
  try {
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
    console.warn('Microphone not available:', e);
    return;
  }
  const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
  mediaRecorder = new MediaRecorder(audioStream);
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0 && sendMedia) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = typeof reader.result === 'string' ? reader.result.split(',')[1] : '';
        if (base64) sendMedia('audio', base64, mime);
      };
      reader.readAsDataURL(e.data);
    }
  };
  mediaRecorder.start(AUDIO_CHUNK_MS);
}

export function stopAllCapture() {
  if (screenInterval) {
    clearInterval(screenInterval);
    screenInterval = null;
  }
  if (cameraInterval) {
    clearInterval(cameraInterval);
    cameraInterval = null;
  }
  if (screenStream) {
    screenStream.getTracks().forEach((t) => t.stop());
    screenStream = null;
  }
  if (cameraStream) {
    cameraStream.getTracks().forEach((t) => t.stop());
    cameraStream = null;
  }
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    mediaRecorder = null;
  }
  if (audioStream) {
    audioStream.getTracks().forEach((t) => t.stop());
    audioStream = null;
  }
  screenCanvas = null;
  screenCtx = null;
  screenVideo = null;
  cameraVideo = null;
}
