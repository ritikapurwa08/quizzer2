/**
 * Utilities for matching questions and set names to granular canonical sub-topics.
 * Used across Question Import Wizard, Candidate Set API, and local pool management.
 */

export function matchesSubTopic(q: any, subTopicId?: string, subTopicName?: string): boolean {
  if (!subTopicId || subTopicId === "all") return true;
  if (q.subTopicId && q.subTopicId === subTopicId) return true;

  const st = (q.sourceTopic || q.subTopic || "").toLowerCase();

  // Topic 6: अपवाह तंत्र
  if (subTopicId === "sub_06_rivers") {
    return st.includes("नदी") || st.includes("नदि") || st.includes("अपवाह") || (!st.includes("झील") && !st);
  }
  if (subTopicId === "sub_06_lakes") {
    return st.includes("झील");
  }

  // Topic 17: प्रमुख राजपूत राजवंश
  if (subTopicId === "sub_17_pratihara") {
    return st.includes("प्रतिहार") || st.includes("गुर्जर");
  }
  if (subTopicId === "sub_17_chauhan") {
    return st.includes("चौहान");
  }
  if (subTopicId === "sub_17_guhil") {
    return st.includes("गुहिल") || st.includes("सिसोदिया") || st.includes("मेवाड़") || st.includes("गुहिलोत");
  }
  if (subTopicId === "sub_17_rathore") {
    return st.includes("राठौड़") || st.includes("राठौड़");
  }
  if (subTopicId === "sub_17_kachwaha") {
    return st.includes("कछवाहा") || st.includes("आमेर");
  }
  if (subTopicId === "sub_17_other") {
    return (
      st.includes("अन्य") ||
      st.includes("भाटी") ||
      st.includes("जाट") ||
      st.includes("प्रशासनिक") ||
      st.includes("स्त्रोत") ||
      st.includes("राजपूत युग") ||
      st.includes("महाजनपद")
    );
  }

  // Topic 22: राजनीतिक जन-जागरण, संगठन एवं समाचार पत्र
  if (subTopicId === "sub_22_orgs") {
    return st.includes("संगठन") || st.includes("संस्था") || !st.includes("पत्रकारिता");
  }
  if (subTopicId === "sub_22_media") {
    return st.includes("समाचार") || st.includes("पत्रकारिता") || st.includes("प्रेस") || st.includes("अखबार");
  }

  // Topic 23: प्रमुख व्यक्तित्व
  if (subTopicId === "sub_23_women") {
    return st.includes("महिला") || st.includes("वीरांगना");
  }
  if (subTopicId === "sub_23_prominent") {
    return (st.includes("प्रमुख व्यक्तित्व") || !st) && !st.includes("महिला");
  }

  // Topic 46: प्रमुख आयोग
  if (subTopicId === "sub_46_rpsc") {
    return st.includes("लोक सेवा आयोग") || st.includes("rpsc");
  }
  if (subTopicId === "sub_46_rshrc") {
    return st.includes("मानवाधिकार") || st.includes("rshrc");
  }
  if (subTopicId === "sub_46_lokayukta") {
    return st.includes("लोकायुक्त");
  }
  if (subTopicId === "sub_46_other") {
    return (
      st.includes("महिला आयोग") ||
      st.includes("निर्वाचन") ||
      st.includes("वित्त") ||
      st.includes("विधिक") ||
      st.includes("प्रशासन") ||
      st.includes("उच्च न्यायालय")
    );
  }

  return Boolean(subTopicName && st.includes(subTopicName.toLowerCase()));
}

export function matchesSubTopicSetName(name: string, subTopicId?: string, subTopicName?: string): boolean {
  if (!name || !subTopicId || subTopicId === "all") return false;
  const n = name.toLowerCase();

  // Topic 6
  const isGenericTopic6 = n.includes("अपवाह तंत्र") && n.includes("झील");
  if (subTopicId === "sub_06_lakes") {
    if (isGenericTopic6) return false;
    return n.includes("झील");
  }
  if (subTopicId === "sub_06_rivers") {
    if (isGenericTopic6) return true;
    return n.includes("नदी") || n.includes("नदि") || n.includes("अपवाह");
  }

  // Topic 17
  if (subTopicId === "sub_17_pratihara") return n.includes("प्रतिहार") || n.includes("गुर्जर");
  if (subTopicId === "sub_17_chauhan") return n.includes("चौहान");
  if (subTopicId === "sub_17_guhil") return n.includes("गुहिल") || n.includes("सिसोदिया") || n.includes("मेवाड़") || n.includes("गुहिलोत");
  if (subTopicId === "sub_17_rathore") return n.includes("राठौड़") || n.includes("राठौड़");
  if (subTopicId === "sub_17_kachwaha") return n.includes("कछवाहा") || n.includes("आमेर");
  if (subTopicId === "sub_17_other") return n.includes("अन्य") || n.includes("भाटी") || n.includes("जाट");

  // Topic 22
  if (subTopicId === "sub_22_orgs") return n.includes("संगठन") || n.includes("संस्था");
  if (subTopicId === "sub_22_media") return n.includes("समाचार") || n.includes("पत्रकारिता") || n.includes("प्रेस");

  // Topic 23
  if (subTopicId === "sub_23_women") return n.includes("महिला") || n.includes("वीरांगना");
  if (subTopicId === "sub_23_prominent") return n.includes("प्रमुख व्यक्तित्व") && !n.includes("महिला");

  // Topic 46
  if (subTopicId === "sub_46_rpsc") return n.includes("लोक सेवा आयोग") || n.includes("rpsc");
  if (subTopicId === "sub_46_rshrc") return n.includes("मानवाधिकार");
  if (subTopicId === "sub_46_lokayukta") return n.includes("लोकायुक्त");
  if (subTopicId === "sub_46_other") return n.includes("महिला आयोग") || n.includes("निर्वाचन") || n.includes("वित्त") || n.includes("विधिक");

  return Boolean(subTopicName && n.includes(subTopicName.toLowerCase()));
}

export function calculateSubTopicNextPart(
  setsList: Array<{ name: string; subTopicId?: string; subTopic?: string }>,
  subTopicId?: string,
  subTopicName?: string
): number {
  if (!subTopicId || subTopicId === "all") {
    let maxPart = 0;
    for (const s of setsList) {
      const m = s.name.match(/(?:Part|भाग|Set|सेट)[\s\-–—:]*(\d+)/i) || s.name.match(/(\d+)/);
      if (m) {
        const num = parseInt(m[1], 10);
        if (num > maxPart) maxPart = num;
      }
    }
    return maxPart > 0 ? maxPart + 1 : setsList.length + 1;
  }

  const matching = setsList.filter((s) => {
    if (s.subTopicId && s.subTopicId === subTopicId) return true;
    if (s.subTopic && subTopicName && s.subTopic.includes(subTopicName)) return true;
    return matchesSubTopicSetName(s.name, subTopicId, subTopicName);
  });

  let maxPart = 0;
  for (const s of matching) {
    const m = s.name.match(/(?:Part|भाग|Set|सेट)[\s\-–—:]*(\d+)/i) || s.name.match(/(\d+)/);
    if (m) {
      const num = parseInt(m[1], 10);
      if (num > maxPart) maxPart = num;
    }
  }

  return maxPart > 0 ? maxPart + 1 : matching.length + 1;
}

export function filterQuestionsBySubTopic(
  questions: any[],
  subTopicId?: string,
  subTopicName?: string
): any[] {
  if (!subTopicId || subTopicId === "all") return questions;
  return questions.filter((q) => matchesSubTopic(q, subTopicId, subTopicName));
}
