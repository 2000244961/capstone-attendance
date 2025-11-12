
// Debug helper functions for face-api
export function debugDescriptor(descriptor) {
    if (!Array.isArray(descriptor)) return;
    console.log('[face-api] Face descriptor:', descriptor);
}

export function debugFaceRecognition(data) {
    console.log('[face-api] Face recognition debug:', data);
}

