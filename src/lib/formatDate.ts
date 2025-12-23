import { Timestamp } from "firebase/firestore";

export function formatDate(value: any): string {
  try {
    if (!value) return "Recently";

    // Firestore Timestamp
    if (value instanceof Timestamp) {
      return value.toDate().toLocaleDateString();
    }

    // Firestore timestamp-like object
    if (typeof value === "object" && value.seconds) {
      return new Date(value.seconds * 1000).toLocaleDateString();
    }

    // ISO string / Date / number
    const date = new Date(value);
    if (isNaN(date.getTime())) return "Recently";

    return date.toLocaleDateString();
  } catch {
    return "Recently";
  }
}
