"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Container,
  Modal,
  PlayerChip,
  ProgressBar,
  Stack,
  AnimatedNumber,
} from "@/components";
import type { ButtonVariant } from "@/components";

const BUTTON_VARIANTS: ButtonVariant[] = ["primary", "secondary", "danger", "success", "ghost"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col items-start gap-4">
      <h2 className="font-display text-foreground text-2xl">{title}</h2>
      {children}
    </section>
  );
}

export default function ShowcasePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [coins, setCoins] = useState(120);

  return (
    <Container maxWidth="lg" className="flex flex-col gap-12 py-10">
      <header>
        <h1 className="font-display text-foreground text-4xl">Numera Design System</h1>
        <p className="text-foreground/70 mt-2">
          Original components for the Numera visual identity — bold, chunky, and mobile-first.
        </p>
      </header>

      <Section title="Buttons">
        <Stack direction="row" gap="md" wrap>
          {BUTTON_VARIANTS.map((variant) => (
            <Button key={variant} variant={variant}>
              {variant}
            </Button>
          ))}
        </Stack>
        <Stack direction="row" gap="md" wrap align="center">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button disabled>Disabled</Button>
          <Button leftIcon={<Zap size={18} />}>With icon</Button>
        </Stack>
      </Section>

      <Section title="Cards">
        <Stack direction="row" gap="md" wrap>
          <Card className="max-w-xs">
            <p className="font-semibold">Standard card</p>
            <p className="text-foreground/70 text-sm">Used for stats, settings, and summaries.</p>
          </Card>
        </Stack>
      </Section>

      <Section title="Badges">
        <Stack direction="row" gap="sm" wrap>
          <Badge tone="neutral">Neutral</Badge>
          <Badge tone="blue">Safe</Badge>
          <Badge tone="yellow">Caution</Badge>
          <Badge tone="red">Danger</Badge>
          <Badge tone="green">Survivor</Badge>
          <Badge tone="purple">Epic</Badge>
        </Stack>
      </Section>

      <Section title="Progress bars">
        <Stack gap="sm" className="w-full max-w-sm">
          <ProgressBar value={30} max={100} label="XP progress" colorClassName="bg-numera-blue" />
          <ProgressBar
            value={75}
            max={100}
            label="Daily challenge progress"
            colorClassName="bg-numera-green"
          />
        </Stack>
      </Section>

      <Section title="Player chips">
        <Stack direction="row" gap="lg" wrap>
          <PlayerChip name="Maya" colorId="blue" lives={2} maxLives={3} />
          <PlayerChip name="Theo" colorId="red" lives={3} maxLives={3} isActive />
          <PlayerChip name="Zara" colorId="yellow" lives={0} maxLives={2} isEliminated />
          <PlayerChip name="Kai" colorId="purple" lives={1} maxLives={1} />
        </Stack>
      </Section>

      <Section title="Animated numbers">
        <Stack direction="row" gap="md" align="center">
          <AnimatedNumber value={coins} label="Coins" className="text-numera-outline text-4xl" />
          <Button size="sm" onClick={() => setCoins((c) => c + 50)}>
            +50 coins
          </Button>
        </Stack>
      </Section>

      <Section title="Modal">
        <Button onClick={() => setModalOpen(true)}>Open settings</Button>
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Settings">
          <p className="text-foreground/80 mb-4 text-sm">
            This is an accessible modal: focus is trapped inside, Escape closes it, and focus
            returns to the button that opened it.
          </p>
          <Button onClick={() => setModalOpen(false)} fullWidth>
            Close
          </Button>
        </Modal>
      </Section>
    </Container>
  );
}
