import { SyllabusTracker } from "@/components/syllabus/SyllabusTracker";

export const metadata = {
  title: "Syllabus Tracker | Quizzer",
  description: "RPSC Senior Teacher (2nd Grade) Paper-1 syllabus coverage and preparation progress tracker.",
};

export default function SyllabusPage() {
  return (
    <div className="space-y-6">
      <SyllabusTracker isStandalonePage={true} />
    </div>
  );
}
