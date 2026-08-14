import { FaWhatsapp } from "react-icons/fa";
import { COMPANY, whatsappHref } from "../data/company";

export default function FloatingWhatsApp() {
  if (!COMPANY.whatsappDigits) return null;

  return (
    <a
      href={whatsappHref}
      className="floating-whatsapp"
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat with ${COMPANY.name} on WhatsApp`}
    >
      <FaWhatsapp />
    </a>
  );
}
