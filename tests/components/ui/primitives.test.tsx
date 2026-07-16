import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  FieldError,
  Input,
  Label,
  Progress,
  RadioGroup,
  Select,
  Sheet,
  Skeleton,
  Table,
  Tabs,
  Textarea,
  Tooltip,
} from "../../../components/ui";
import { StatusMatrix } from "../../../components/status";

describe("UI primitives", () => {
  it("renders native controls with labels, descriptions, errors, and keyboard behavior", async () => {
    const user = userEvent.setup();
    render(
      <form>
        <Label htmlFor="name">Name</Label>
        <Input aria-describedby="name-error" aria-invalid="true" id="name" />
        <FieldError id="name-error">Name needs review.</FieldError>
        <Textarea aria-label="Review note" />
        <Select aria-label="Purpose">
          <option>Case preparation handoff</option>
        </Select>
        <Checkbox id="confirm" label="Confirm authority" />
        <RadioGroup
          legend="Provider"
          name="provider"
          options={[
            { label: "OpenAI", value: "openai" },
            { label: "Gemini", value: "gemini" },
          ]}
        />
        <Button>Continue</Button>
      </form>,
    );

    await user.tab();
    expect(screen.getByLabelText("Name")).toHaveFocus();
    expect(screen.getByRole("alert")).toHaveTextContent("Name needs review.");
    expect(screen.getByRole("button", { name: "Continue" })).toHaveAttribute("type", "button");
  });

  it("renders structural primitives with accessible names and semantics", () => {
    render(
      <>
        <Alert title="Coverage warning" tone="warning">
          Missing page is visible.
        </Alert>
        <Dialog title="Resolve citation">Dialog body</Dialog>
        <Sheet title="Source drawer">Sheet body</Sheet>
        <Progress label="Processing stages" value={2} max={4} />
        <Skeleton label="Loading source" />
        <Tabs tabs={[{ id: "purpose", label: "Purpose", selected: true }]} />
        <Table>
          <tbody>
            <tr className="cfn-compact-row">
              <td>Document</td>
            </tr>
          </tbody>
        </Table>
        <Tooltip note="Supplemental only">
          <button type="button">Visible label</button>
        </Tooltip>
      </>,
    );

    expect(screen.getByRole("dialog", { name: "Resolve citation" })).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Loading source" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Processing stages" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Purpose" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: /visible label/i })).toHaveTextContent("Visible label");
  });

  it("renders five separate status systems with text and icons", () => {
    render(
      <StatusMatrix
        caseStatus="blocked"
        evidenceNature="reported_or_alleged_in_source"
        itemOrigin="ai_suggestion"
        reviewStatus="pending"
        supportStatus="citation_unresolved"
      />,
    );

    expect(screen.getByText("Evidence nature")).toBeInTheDocument();
    expect(screen.getByText("Reported or alleged in source")).toBeInTheDocument();
    expect(screen.getByText("Item origin")).toBeInTheDocument();
    expect(screen.getByText("AI suggestion")).toBeInTheDocument();
    expect(screen.getByText("Support status")).toBeInTheDocument();
    expect(screen.getByText("Citation unresolved")).toBeInTheDocument();
    expect(screen.getByText("Review status")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Case status")).toBeInTheDocument();
    expect(screen.getByText("Blocked")).toBeInTheDocument();
  });
});
