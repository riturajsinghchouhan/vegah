import Button from "./Button";

const EmptyState = ({ title, description, actionLabel, onAction }) => (
  <div className="surface-card p-6 text-center">
    <h3 className="text-lg font-semibold text-app-text">{title}</h3>
    <p className="mt-2 text-sm leading-6 text-app-subtle">{description}</p>
    {actionLabel ? (
      <Button className="mt-4" onClick={onAction} variant="secondary">
        {actionLabel}
      </Button>
    ) : null}
  </div>
);

export default EmptyState;
