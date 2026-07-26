import { db } from "../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { DEFAULT_EVENTS } from "../lib/dbService";

// DEFAULT_EVENTS ko export karna hoga

  try {
    for (const event of DEFAULT_EVENTS) {
      await setDoc(doc(db, "events", event.id), event);
      console.log("Added:", event.title);
    }

    console.log("All events uploaded successfully.");
  } catch (err) {
    console.error(err);
  }


