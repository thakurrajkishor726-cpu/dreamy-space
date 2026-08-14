const COMMITMENTS = [
  { title: "Drawings before decisions" },
  { title: "Made in our own workshop" },
  { title: "One team, start to finish" },
];

const CARDS = [
  {
    title: "Experienced Team",
    copy: "Leads who have run these jobs for years, not months.",
    tone: "primary",
    icon: "👷‍♂️",
  },
  {
    title: "Guaranteed Works",
    copy: "Vetted suppliers, and sign-off at every stage.",
    tone: "light",
    icon: "🛡️",
  },
  {
    title: "Free Consultation",
    copy: "We measure and plan before you spend anything.",
    tone: "light",
    icon: "🤝",
  },
  {
    title: "Reasonable Price",
    copy: "Specced so the money lands where you will notice it.",
    tone: "dark",
    icon: "💱",
  },
];

export default function Deliverables() {
  return (
    <section className="deliverables section-padding">
      <div className="container">
        <div className="deliverables__grid">
          <div className="deliverables__lead">
            <div className="delhead">
              <div className="deliverables__logo">⌂</div>
              <h3 className="deliverables__title">Our Service Commitments</h3>
              <ul className="deliverables__list">
                {COMMITMENTS.map((item) => (
                  <li key={item.title}>{item.title}</li>
                ))}
              </ul>
            </div>
            <a href="/contact" className="commitments-cta">
              <span className="commitments-cta__text">Make An Appointment</span>
              <span className="commitments-cta__arrow">→</span>
            </a>
          </div>

          <div className="deliverables__cards">
            {CARDS.map((card) => (
              <div className={`deliverables__card deliverables__card--${card.tone}`} key={card.title}>
                <div className="deliverables__icon">{card.icon}</div>
                <h5 className="deliverables__card-title">{card.title}</h5>
                <p className="deliverables__card-copy">{card.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
