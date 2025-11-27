
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL, listAll, FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from '../firebaseConfig';

// Singleton pattern for Firebase App
let app: FirebaseApp | undefined;
let storage: FirebaseStorage | undefined;

try {
    if (firebaseConfig.projectId && firebaseConfig.projectId !== "PROJECT_ID") {
        // Check if app is already initialized to avoid "duplicate app" errors
        if (getApps().length === 0) {
            app = initializeApp(firebaseConfig);
        } else {
            app = getApp();
        }
        storage = getStorage(app);
    }
} catch (error) {
    console.error("Firebase initialization error:", error);
}

export const uploadFileToFirebase = async (file: File): Promise<string> => {
    if (!storage) {
        throw new Error("Firebase Storage chưa sẵn sàng! Vui lòng kiểm tra firebaseConfig.ts");
    }

    try {
        // Create a unique filename: timestamp_filename
        const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
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

export const getStoredImages = async (): Promise<string[]> => {
    if (!storage) return [];

    try {
        const listRef = ref(storage, 'portfolio_images/');
        const res = await listAll(listRef);
        
        // Fetch all download URLs in parallel
        const urlPromises = res.items.map((itemRef) => getDownloadURL(itemRef));
        const urls = await Promise.all(urlPromises);
        
        // Return latest images first (simple reverse, though timestamps in name help sort logic if needed)
        return urls.reverse();
    } catch (error) {
        console.error("Failed to list images:", error);
        return [];
    }
};
