import { NewOpportunityClient } from "./new-opportunity-client";

export default function NewOpportunityPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-xl font-semibold">Add Opportunity</h1>
      <NewOpportunityClient />
    </div>
  );
}
