import { Compass } from "lucide-react";
import Button from "../Components/Button";
import { EmptyState } from "../Components/Feedback";

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <EmptyState
        icon={<Compass className="h-7 w-7" />}
        title="This page went off"
        message="It may have moved, or the link is mistyped. There's plenty of good food elsewhere."
        action={
          <div className="flex gap-2">
            <Button to="/">Home</Button>
            <Button to="/browse" variant="outline">
              Find food
            </Button>
          </div>
        }
      />
    </div>
  );
}
