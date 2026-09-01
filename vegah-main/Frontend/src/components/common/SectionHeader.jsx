const SectionHeader = ({ eyebrow, title, action }) => (
  <div className="mb-4 flex items-end justify-between gap-3">
    <div>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className="section-title mt-1">{title}</h2>
    </div>
    {action}
  </div>
);

export default SectionHeader;
