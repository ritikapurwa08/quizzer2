import { SyllabusTracker } from "@/components/syllabus/SyllabusTracker";

export const metadata = {
  title: "परीक्षा पाठ्यक्रम ट्रैकर | Quizzer",
  description: "वरिष्ठ अध्यापक (2nd Grade) एवं RSMSSB CET का संपूर्ण पाठ्यक्रम, उभयनिष्ठ टॉपिक्स और प्रगति ट्रैकर।",
};

export default function SyllabusPage() {
  return (
    <div className="space-y-6">
      <SyllabusTracker isStandalonePage={true} />
    </div>
  );
}
