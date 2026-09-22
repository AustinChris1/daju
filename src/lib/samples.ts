import type { Country } from "@/lib/countries";

// Composite examples built from the patterns in published warnings. Names and numbers are invented; nothing here is a real advert.
export const SAMPLES: { id: string; label: string; country: Country; text: string }[] = [
  {
    id: "thailand",
    label: "Thailand customer-service ad",
    country: "KE",
    text: `URGENT HIRING!! Customer Service Representatives needed in Bangkok, Thailand. Salary $1,500 monthly plus free accommodation and meals. No experience needed, full training provided. Free flight ticket! Only a processing fee of Ksh 25,000 for visa and documentation. Contact Mercy on WhatsApp +254 712 000 000 or Telegram @mercyjobsKE. Limited slots, apply today!`,
  },
  {
    id: "lagos-offer",
    label: "Lagos offer letter with a bond",
    country: "NG",
    text: `ZENITH CONSULT NIGERIA LTD
OFFER OF EMPLOYMENT

Dear Chinedu,

We are pleased to offer you the position of Business Development Executive at a gross salary of N150,000 per month. Your probationary period shall be six (6) months, during which the first three months shall be unpaid training. You will be bonded for a period of 2 years; on resignation before the end of this period you shall pay the sum of N3,000,000 as liquidated damages. Your original certificates shall be submitted to HR and retained for the duration of the bond. The company may terminate this contract at any time without notice.

Kindly confirm acceptance by replying to hr.zenithconsult@gmail.com.

Regards,
HR Manager`,
  },
  {
    id: "uganda-gulf",
    label: "Uganda Gulf housemaid job",
    country: "UG",
    text: `Jobs available in Saudi Arabia and Dubai for housemaids and drivers. Salary 1,200 SAR to 1,800 SAR monthly. Visa guaranteed, no interview needed. We are agents of Moonlight Recruiting Agency Uganda Ltd. Pay medical fee UGX 350,000 and registration UGX 150,000 before processing. WhatsApp 0756 000 111 now, limited slots.`,
  },
  {
    id: "alabuga",
    label: "Russia work-and-study programme",
    country: "NG",
    text: `Alabuga Start programme in Russia for ladies aged 18 to 22! Work and study, free flight ticket and hostel, salary 700 USD monthly plus free Russian lessons. No experience required. Apply now via Telegram @alabugastart_africa. First 50 applicants only!`,
  },
  {
    id: "direct-employer",
    label: "Direct employer, company email",
    country: "NG",
    text: `Good day. This is Adaeze from Worknigeria.com Limited. We are recruiting a front-end developer for a fintech client in Lekki. Please send your CV to careers@worknigeria.com. There are no fees at any stage. Interviews are held at our office.`,
  },
];
