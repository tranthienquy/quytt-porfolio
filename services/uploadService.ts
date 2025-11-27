
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firebaseConfig } from '../firebaseConfig';

// Initialize Firebase only if config is valid (basic check)
let storage: any = null;

try {
    if (firebaseConfig.projectId !== "PROJECT_ID") {
        const app = initializeApp(firebaseConfig);
        storage = getStorage(app);
    }
} catch (error) {
    console.error("Firebase initialization error:", error);
}

export const uploadFileToFirebase = async (file: File): Promise<string> => {
    if (!storage) {
        throw new Error("Firebase chưa được cấu hình! Vui lòng cập nhật file firebaseConfig.ts");
    }

    try {
        // Create a unique filename: timestamp_filename
        const fileName = `${Date.now()}_${file.name}`;
        const storageRef = ref(storage, 'portfolio_images/' + fileName);

        // Upload
        const snapshot = await uploadBytes(storageRef, file);

        // Get URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error("Upload failed:", error);
        throw error;
    }
};
