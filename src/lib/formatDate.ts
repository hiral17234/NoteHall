export function formatDate(ts: any): string {
  if (!ts) return "Recently";

  try {
    // Firestore Timestamp
    if (typeof ts === "object" && "seconds" in ts) {
      return new Date(ts.seconds * 1000).toLocaleDateString();
    }

    // ISO string / Date
    const d = new Date(ts);
    if (isNaN(d.getTime())) return "Recently";

    return d.toLocaleDateString();
  } catch {
    return "Recently";
  }
}
