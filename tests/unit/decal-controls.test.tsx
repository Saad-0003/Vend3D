import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import { DecalControls } from "@/components/studio/decal-controls";
import { getProductConfig } from "@/lib/products/config";
import type { DecalSettings } from "@/lib/products/configuration";

/**
 * The numeric decal fields sit beside the sliders and write through the same
 * `onChange` as the 3D scene and undo/redo, so the only thing this test has to
 * pin is the contract edge: typed values are clamped, non-numbers never commit,
 * and an external change (undo, a restored design, the paired slider) flows
 * back into the field.
 */

const product = getProductConfig("heavyweight-boxy-tee")!;
const zones = product.decal.zones;

const base: DecalSettings = {
  name: "artwork.png",
  zone: zones[0]!.id,
  scale: 0.6,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  avoidSeams: true,
};

function Harness({ initial = base, onChange }: { initial?: DecalSettings; onChange?: (next: DecalSettings) => void }) {
  const [settings, setSettings] = useState(initial);
  return (
    <DecalControls
      zones={zones}
      thumbnailUrl="data:image/png;base64,AAAA"
      settings={settings}
      onChange={(next) => {
        onChange?.(next);
        setSettings(next);
      }}
      onReplace={() => {}}
      onRemove={() => {}}
      onFile={() => {}}
    />
  );
}

describe("decal numeric controls", () => {
  it("pairs each slider with a numeric field in contract units", () => {
    render(<Harness />);

    expect(screen.getByLabelText("Scale value")).toHaveValue("0.60");
    expect(screen.getByLabelText("Rotation value")).toHaveValue("0");
    expect(screen.getByLabelText("Horizontal value")).toHaveValue("0.00");
    expect(screen.getByLabelText("Vertical value")).toHaveValue("0.00");

    expect(screen.getByLabelText("Scale slider")).toHaveAttribute("min", "0.3");
    expect(screen.getByLabelText("Scale slider")).toHaveAttribute("max", "1.5");
    expect(screen.getByLabelText("Rotation slider")).toHaveAttribute("min", "-180");
    expect(screen.getByLabelText("Horizontal slider")).toHaveAttribute("max", "1");
  });

  it("clamps typed values to the contract limits", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.clear(screen.getByLabelText("Scale value"));
    await user.type(screen.getByLabelText("Scale value"), "9");
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ scale: 1.5 }));

    await user.clear(screen.getByLabelText("Rotation value"));
    await user.type(screen.getByLabelText("Rotation value"), "-999");
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ rotation: -180 }));

    await user.clear(screen.getByLabelText("Horizontal value"));
    await user.type(screen.getByLabelText("Horizontal value"), "4");
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ offsetX: 1 }));
  });

  it("rounds typed values to the step and normalises on blur", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    const field = screen.getByLabelText("Vertical value");
    await user.clear(field);
    await user.type(field, "0.126");
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ offsetY: 0.13 }));

    await user.tab();
    expect(field).toHaveValue("0.13");
  });

  it("ignores non-numeric text and restores the committed value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    const field = screen.getByLabelText("Scale value");
    await user.clear(field);
    await user.type(field, "wide");
    expect(onChange).not.toHaveBeenCalled();

    await user.tab();
    expect(field).toHaveValue("0.60");
  });

  it("keeps the field in sync with its slider", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Scale slider"), { target: { value: "0.9" } });

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ scale: 0.9 }));
    expect(screen.getByLabelText("Scale value")).toHaveValue("0.90");
  });

  it("follows an external change, as undo or redo produces", () => {
    const { rerender } = render(<Harness initial={{ ...base, scale: 1.2 }} />);
    expect(screen.getByLabelText("Scale value")).toHaveValue("1.20");

    // Same props as the configurator store after an undo.
    rerender(
      <DecalControls
        zones={zones}
        thumbnailUrl="data:image/png;base64,AAAA"
        settings={{ ...base, scale: 0.4, rotation: 45 }}
        onChange={() => {}}
        onReplace={() => {}}
        onRemove={() => {}}
        onFile={() => {}}
      />,
    );

    expect(screen.getByLabelText("Scale value")).toHaveValue("0.40");
    expect(screen.getByLabelText("Rotation value")).toHaveValue("45");
  });
});
