# Ratzon 2:30 Pitch Kit

This folder contains a 7-slide pitch structure for a 2 minute 30 second judge or investor pitch.

## Files

- `2m30_pitch_template.md` - slide-by-slide timing, talk track, and visual direction.
- `ratzon_pitch.html` - browser deck template that can be opened or printed to PDF.
- `generate_ratzon_pptx.js` - source script for regenerating a PPTX deck when `pptxgenjs` is available.
- `ratzon_pitch.pptx` - generated editable deck artifact, if present locally.

## Timing

| Slide | Time | Purpose |
| --- | ---: | --- |
| 1. Cover | 0:10 | Name, category, one-line promise |
| 2. Problem | 0:20 | Explain why DeFi execution is still hard |
| 3. Demo Moment | 0:30 | Show one natural-language request becoming a safe route |
| 4. How It Works | 0:25 | Prove there is real architecture under the demo |
| 5. Product Vision | 0:20 | Make it bigger than a Telegram bot |
| 6. Wedge | 0:25 | Who uses it first and how it expands |
| 7. Traction / Ask | 0:20 | What is live, what is next, and how to try it |

Total: 2:30.

## Delivery Rule

Do not read the slides. Use each slide as visual proof while the talk track explains:

1. the user pain,
2. the product behavior,
3. the technical wedge,
4. the next milestone.

The safest live-demo prompt is:

```text
Swap 50 USDT TRC20 to BTC
```

It shows Ratzon's strongest story: natural language, route selection, minimum amount, wrong-network protection, and recoverable payment details.
