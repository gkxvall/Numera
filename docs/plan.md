Numera — Complete Implementation Plan

1. Project Overview

Numera is a mobile-first multiplayer number survival game designed for local party play and future online multiplayer.

The core gameplay is simple:

1. Players join a match.
2. The game secretly generates a losing target number.
3. Players take turns adding between 1 and 3 clicks to a shared counter.
4. The player whose click reaches the losing number loses a life or is eliminated.
5. The remaining players continue through new rounds.
6. The final surviving player wins the match.

Numera must feel energetic, competitive, humorous, and highly replayable.

The visual style should use the energy of modern cartoon battle games such as Brawl Stars as broad inspiration:

- Bold shapes
- Expressive characters
- Thick outlines
- Bright gradients
- Fast animations
- Large mobile controls
- Strong visual hierarchy
- Reward-heavy progression
- Dramatic winner and elimination moments

Do not copy Brawl Stars characters, assets, layouts, logos, sounds, icons, maps, or exact visual elements. Create a fully original Numera identity.

⸻

2. Main Product Goals

Build a complete, polished, playable web game that:

- Works smoothly on mobile phones, tablets, and desktop browsers
- Supports local multiplayer using one shared device
- Supports between 2 and 10 players
- Has simple rules that can be understood within seconds
- Includes multiple game modes
- Includes player lives, power-ups, rewards, statistics, and progression
- Feels visually exciting and responsive
- Can later support real-time online multiplayer
- Is installable as a Progressive Web App
- Persists player progress locally
- Has a clean and maintainable architecture
- Includes automated tests
- Includes documentation
- Can be deployed to production

⸻

3. Recommended Technology Stack

Use the following stack unless the existing project already uses compatible alternatives.

Frontend

- Next.js
- TypeScript
- React
- Tailwind CSS
- Framer Motion
- Zustand
- React Hook Form
- Zod
- Lucide React icons
- Howler.js for sound management

Data and persistence

For version 1:

- LocalStorage
- IndexedDB where larger persistence is needed
- Zustand persistence middleware

For future online features:

- PostgreSQL
- Prisma ORM
- WebSockets or Socket.IO
- Redis for room state and temporary match state

Testing

- Vitest
- React Testing Library
- Playwright
- ESLint
- Prettier
- TypeScript strict mode

Deployment

- Vercel for the web application
- Optional Supabase or Neon for future PostgreSQL hosting
- Optional Upstash Redis for online multiplayer

⸻

4. Development Principles

Follow these rules throughout implementation:

1. Use strict TypeScript.
2. Avoid any.
3. Keep components small and reusable.
4. Separate game logic from UI code.
5. Make game logic deterministic and testable.
6. Validate all settings using Zod.
7. Store reusable constants in dedicated configuration files.
8. Use semantic HTML.
9. Meet accessibility requirements.
10. Design mobile-first.
11. Maintain at least 60 FPS for standard animations.
12. Avoid unnecessary dependencies.
13. Do not leave unfinished placeholders.
14. Do not use fake buttons or inactive UI.
15. Every visible interaction must work.
16. Update documentation after every development stage.
17. Commit after every meaningful completed unit of work.
18. Do not continue to the next stage until the current stage passes its completion checklist.

⸻

5. Core Game Terminology

Use consistent terminology throughout the codebase and interface.

- Match: A complete game ending with one winner
- Round: A section of the match ending when a player loses a life or is eliminated
- Turn: One player’s opportunity to add clicks
- Target: The secret losing number
- Counter: The shared current number
- Move: The amount added during a turn
- Life: A player’s remaining protection before elimination
- Power-up: A special gameplay ability
- Survivor: A player who is not eliminated
- Champion: The final surviving player
- Host: The player controlling match setup
- Danger zone: The portion of the counter range near the target

⸻

6. Core Game Rules

6.1 Match setup

The host must be able to configure:

- Match name
- Number of players
- Player names
- Player avatars
- Player colors
- Game mode
- Number of lives
- Minimum target number
- Maximum target number
- Maximum move size
- Turn timer
- Power-ups enabled or disabled
- Danger indicator enabled or disabled
- Random player order enabled or disabled
- Sound enabled or disabled
- Vibration enabled or disabled
- Special events enabled or disabled

  6.2 Default rules

Use these default settings:

- Players: 2 to 8
- Lives: 1
- Minimum target: 20
- Maximum target: 40
- Maximum move: 3
- Turn timer: 10 seconds
- Random player order: enabled
- Power-ups: enabled
- Danger indicator: enabled
- Special events: disabled

  6.3 Turn rules

During a turn:

1. Display the active player.
2. Hide controls until the player confirms that the phone has been passed to them.
3. Allow the player to choose a move between 1 and the configured maximum move.
4. Animate the counter increasing one unit at a time.
5. Check each increment against the secret target.
6. If an increment reaches the target, immediately stop the animation.
7. Trigger the losing sequence.
8. Deduct one life from the active player.
9. Eliminate the player if they have no remaining lives.
10. Start a new round with a new target.
11. Continue until only one player remains.

6.4 Important move behavior

A move must be processed one click at a time.

Example:

- Current counter: 18
- Secret target: 20
- Player selects +3
- Counter reaches 19
- Counter reaches 20
- Player loses immediately
- The counter must not continue to 21

  6.5 Target generation

Generate the target securely within the configured range.

Rules:

- The target must be greater than the starting counter.
- Do not display or expose the target in client-visible debug interfaces.
- Do not store it in visible DOM attributes.
- In future online multiplayer, generate and validate the target on the server.
- Avoid generating the same target more than two rounds consecutively.
- Scale target ranges based on the number of active players when adaptive mode is enabled.

Suggested adaptive ranges:

Active players Suggested target range
2 12–24
3 16–32
4 20–40
5–6 25–50
7–8 30–65
9–10 40–80

⸻

7. Game Modes

7.1 Classic Survival

- Every player starts with one life.
- Hitting the target eliminates the player.
- The final player wins.

  7.2 Multi-Life Survival

- Players start with two to five lives.
- Hitting the target removes one life.
- A player is eliminated at zero lives.
- The final player wins.

  7.3 Score Rush

- No immediate eliminations.
- Play a configurable number of rounds.
- Players gain and lose points.
- Highest score wins.

Suggested scoring:

- Survive a round: +2
- Cause a trap for the next player: +1
- Use no power-up during a round: +1
- Hit the target: -3
- Time expires: -1
- Successful shield use: +1

  7.4 Team Battle

- Players are assigned to two or more teams.
- Team members share a life pool or score.
- The final surviving team wins.

  7.5 Reverse Countdown

- The counter starts at a high number.
- Players subtract between 1 and 3.
- The player who reaches zero loses.

  7.6 Sudden Death

- Small target range
- One life
- Five-second timer
- No shields
- Faster animations
- High-intensity presentation

  7.7 Chaos Mode

Enable random events such as:

- Reverse turn order
- Shuffle players
- Double move
- Counter decreases
- Move range changes
- Temporary shield
- Frozen power-ups
- Forced move
- Mystery danger indicator

  7.8 Tournament Mode

- Create brackets from four, eight, or sixteen players.
- Run multiple matches.
- Advance winners automatically.
- Display tournament bracket progress.
- Show final tournament champion.

Tournament mode can be implemented after the core release if required, but the architecture must allow it.

⸻

8. Power-Up System

Power-ups should add strategy without making the game unfair.

Each player may hold a limited number of power-ups.

Default inventory capacity:

- Two power-ups per player

  8.1 Power-ups

Shield

Protects the player from one losing target hit.

After activation:

- The shield is consumed
- The player survives
- The round resets
- The player keeps their life

Peek

Shows a temporary approximate target zone.

Example:

- “The target is between 27 and 32.”

Do not reveal the exact target.

Reverse

Reverses the player order.

Freeze

The next player may only choose +1.

Boost

The current player may choose one additional move value.

Example:

- Default choices: +1, +2, +3
- Boost choices: +1, +2, +3, +4

Skip

Skip the current turn without increasing the counter.

Limit this power-up heavily.

Swap

Swap turn position with another active player.

Counter Pushback

Subtract one or two from the counter.

Do not allow the counter to go below zero.

Scramble

Randomizes player order.

Double Trouble

Forces the next player to take two consecutive turns.

Lucky Dice

Randomly performs a move within the allowed range.

May grant bonus coins when successful.

8.2 Power-up balance rules

- Do not allow unlimited power-up use.
- A player may use at most one power-up per turn.
- Some power-ups must be disabled in competitive modes.
- Prevent combinations that create infinite loops.
- Power-up availability must be configurable.
- Display a short explanation before first use.
- Add cooldowns where appropriate.
- Track all power-up usage in match history.

⸻

9. Special Number Events

Special number events are optional.

Suggested events:

- Multiples of 5: small coin bonus
- Multiples of 7: player earns a random power-up
- Number 13: player order reverses
- Repeated digits such as 22, 33, or 44: mystery event
- Prime numbers: visual bonus effect
- Round milestones: increase tension effects

Ensure events do not accidentally reveal the secret target.

⸻

10. Player System

Each player must have:

interface Player {
id: string;
name: string;
avatarId: string;
colorId: string;
lives: number;
maxLives: number;
score: number;
coinsEarned: number;
powerUps: PlayerPowerUp[];
isEliminated: boolean;
placement?: number;
stats: PlayerMatchStats;
}

10.1 Player creation

Allow players to:

- Enter a display name
- Select an avatar
- Select a color
- Randomize avatar and color
- Reorder players
- Remove players
- Duplicate player settings
- Add bots

Validation:

- Names must be 1 to 16 characters
- Names must be trimmed
- Duplicate names should be allowed but visually distinguished
- Empty names should receive generated names such as “Player 3”

  10.2 Bot players

Include optional offline bots.

Bot personalities:

- Random
- Careful
- Aggressive
- Trickster
- Balanced

Bots must not directly know the secret target.

They may use estimated risk based on:

- Current counter
- Configured target range
- Remaining possible target values
- Available power-ups
- Next player’s lives
- Game mode

⸻

11. Gamification System

Numera should feel rewarding even when the player loses.

11.1 Player profile

Create a local profile containing:

- Display name
- Player level
- Experience points
- Coin balance
- Trophy count
- Selected avatar
- Selected frame
- Selected title
- Unlocked cosmetics
- Achievements
- Match history
- Lifetime statistics
- Daily challenge progress
- Settings

  11.2 Experience points

Award experience for:

- Completing a match
- Winning
- Surviving rounds
- Completing challenges
- Trying new game modes
- Playing with larger groups
- Winning without power-ups
- Winning after reaching one life
- Maintaining streaks

Suggested XP rewards:

Action XP
Complete match 20
Win match 40
Survive a round 5
Complete daily challenge 50
First game of the day 20
Win with 5+ players 25
Comeback victory 30

11.3 Level system

Use a progressive XP curve.

Example:

requiredXp = Math.floor(100 \* Math.pow(level, 1.35));

Level rewards can include:

- Coins
- Avatars
- Frames
- Emotes
- Button skins
- Backgrounds
- Player titles
- Sound packs
- Victory effects

  11.4 Coins

Players earn coins from normal gameplay.

Coins can unlock cosmetics only.

Do not implement pay-to-win mechanics.

Use coins for:

- Avatar skins
- Profile frames
- Background themes
- Counter skins
- Button skins
- Elimination effects
- Victory effects
- Emotes
- Sound packs

  11.5 Trophies

Trophies represent competitive progress.

Suggested behavior:

- Gain trophies for wins
- Gain fewer trophies for low-player matches
- Lose a small number of trophies in ranked modes
- Do not deduct trophies in casual local modes by default

Create trophy leagues:

- Bronze
- Silver
- Gold
- Crystal
- Diamond
- Master
- Legendary

  11.6 Daily challenges

Generate three daily challenges.

Examples:

- Complete two matches
- Win one Classic match
- Survive ten rounds
- Use three different power-ups
- Win without using a shield
- Play with at least four players
- Reach the danger zone five times
- Defeat a bot on hard difficulty

Store the challenge generation date locally.

11.7 Weekly challenges

Examples:

- Win five matches
- Complete fifteen matches
- Earn 1,000 total match points
- Win in three different modes
- Survive fifty rounds

  11.8 Achievements

Create achievement categories:

Beginner

- Play the first match
- Add four players
- Use the first power-up
- Win the first game

Survival

- Survive ten rounds
- Survive one hundred rounds
- Win with one remaining life
- Survive three consecutive danger turns

Social

- Play with five players
- Play with eight players
- Complete a tournament
- Use every available avatar in matches

Strategy

- Win without power-ups
- Win after using Reverse
- Successfully use Shield five times
- Force three eliminations through turn positioning

Mastery

- Win ten matches
- Win fifty matches
- Reach a high trophy league
- Unlock all standard cosmetics

  11.9 Login calendar

Create an optional local daily reward calendar:

- Day 1: coins
- Day 2: XP
- Day 3: random power-up token
- Day 4: coins
- Day 5: cosmetic fragment
- Day 6: coins and XP
- Day 7: mystery cosmetic reward

Do not punish missed days harshly.

11.10 Streaks

Track:

- Daily play streak
- Win streak
- Match completion streak
- Challenge completion streak

Streaks should motivate play without creating unhealthy pressure.

⸻

12. Cosmetic System

Create an original Numera cosmetic system.

12.1 Cosmetic categories

- Avatars
- Avatar skins
- Profile frames
- Nameplate styles
- Player titles
- Counter skins
- Main button skins
- Background arenas
- Elimination effects
- Victory effects
- Emotes
- Sound packs

  12.2 Rarity system

Use these rarity levels:

- Common
- Rare
- Epic
- Mythic
- Legendary

Rarity affects presentation and unlock difficulty only.

It must never affect gameplay strength.

12.3 Unlock system

Cosmetics may be unlocked through:

- Levels
- Coins
- Achievements
- Challenges
- Trophy milestones
- Seasonal tracks
- Special events

  12.4 Initial cosmetic content

Create enough content for the application to feel complete.

Minimum:

- 12 avatars
- 8 profile frames
- 8 titles
- 6 counter skins
- 6 button skins
- 5 arena backgrounds
- 5 elimination effects
- 5 victory effects
- 12 emotes
- 3 sound packs

Use original placeholder vector art where final art is unavailable.

Do not use copyrighted third-party game assets.

⸻

13. Visual Identity

13.1 Brand name

Game name:

Numera

Possible tagline:

Count smart. Tap carefully. Survive.

13.2 Logo direction

Create an original logo with:

- Large bold lettering
- Slightly tilted letters
- Thick dark outline
- Bright inner gradient
- A number, counter, or warning symbol
- Strong readability at small sizes

Do not imitate another game’s exact typography.

13.3 Visual style

Use:

- Thick dark outlines
- Rounded cards
- Strong shadows
- Chunky buttons
- Layered gradients
- Cartoon highlights
- High contrast
- Expressive icons
- Dynamic backgrounds
- Confetti and particles
- Animated number transitions
- Screen shake for elimination
- Scale and bounce for button presses

  13.4 Suggested color palette

Primary colors:

- Electric blue
- Bright yellow
- Coral red
- Purple
- Mint green

Neutral colors:

- Deep navy
- Warm white
- Soft gray
- Near-black outlines

Example palette:

--numera-blue: #2f80ff;
--numera-blue-dark: #1456c4;
--numera-yellow: #ffd447;
--numera-red: #ff4d5f;
--numera-purple: #8854ff;
--numera-green: #39d98a;
--numera-navy: #16213e;
--numera-cream: #fff9ec;
--numera-outline: #111827;

13.5 Typography

Use a bold display font for headings and numbers.

Use a readable rounded font for interface text.

Recommended open-source options:

- Display: Lilita One, Bungee, or Baloo 2
- Interface: Nunito, Fredoka, or Inter

Ensure fonts load efficiently and use fallbacks.

⸻

14. Responsive Design

Build mobile-first.

14.1 Mobile

Primary target:

- 360 × 640 and larger
- One-handed interaction
- Large tap targets
- Bottom-positioned controls
- Safe-area support
- No accidental page scrolling during gameplay

  14.2 Tablet

- Larger arena area
- Side player panels
- Larger animations
- Optional landscape optimization

  14.3 Desktop

- Centered game stage
- Player information on both sides
- Keyboard controls
- Hover effects
- Maximum width to prevent overexpansion

  14.4 Orientation

Support portrait and landscape.

Portrait should be the default experience.

⸻

15. Application Screens

15.1 Splash screen

Include:

- Numera logo
- Animated counter
- Loading progress
- Sound initialization
- First-launch onboarding detection

  15.2 Onboarding

Use three to five short screens:

1. Add players
2. Take turns
3. Choose 1–3
4. Avoid the secret number
5. Last survivor wins

Allow skipping onboarding.

15.3 Home screen

Include:

- Play button
- Quick Match
- Game Modes
- Player profile
- Level and XP
- Coins
- Trophies
- Daily challenges
- Rewards
- Cosmetics
- Statistics
- Settings

  15.4 Player setup screen

Include:

- Add player button
- Player cards
- Avatar selector
- Color selector
- Name field
- Drag-and-drop ordering
- Add bot
- Randomize all
- Continue button

  15.5 Match settings screen

Include:

- Mode selection
- Lives
- Target range
- Maximum move
- Turn timer
- Power-ups
- Danger indicator
- Random order
- Special events
- Advanced settings
- Start match

Provide preset configurations:

- Quick
- Party
- Strategic
- Chaos
- Sudden Death
- Custom

  15.6 Pass-the-phone screen

Display:

- Next player name
- Avatar
- Lives
- “Tap when ready”
- Privacy shield over game state
- Optional short vibration

  15.7 Main game screen

Display:

- Current round
- Current player
- Player order
- Shared counter
- Danger meter
- Remaining lives
- Turn timer
- Move buttons
- Power-up inventory
- Pause button
- Sound control
- Compact match log

The shared counter must be the strongest visual element.

15.8 Elimination screen

Display:

- Losing player
- Losing target
- Elimination animation
- Remaining players
- Round statistics
- Continue button

Keep this sequence brief.

15.9 Winner screen

Display:

- Champion
- Avatar
- Victory animation
- Confetti
- Final ranking
- XP earned
- Coins earned
- Trophies earned
- Completed challenges
- Achievement progress
- Match statistics
- Play again
- Same players
- Change settings
- Return home

  15.10 Profile screen

Display:

- Player level
- XP bar
- Trophies
- League
- Coins
- Selected cosmetics
- Match statistics
- Achievement summary
- Recent matches

  15.11 Cosmetics screen

Include:

- Category tabs
- Item previews
- Owned and locked status
- Prices
- Unlock requirements
- Equip button
- Rarity presentation
- Preview animation

  15.12 Challenges screen

Include:

- Daily challenges
- Weekly challenges
- Progress bars
- Rewards
- Claim buttons
- Reset countdown

  15.13 Statistics screen

Display:

- Total matches
- Wins
- Win rate
- Rounds survived
- Most-used move
- Average move
- Power-ups used
- Most successful power-up
- Fastest elimination
- Longest match
- Highest win streak
- Most-played mode
- Player versus player comparison

  15.14 Match history screen

Store at least the latest 50 matches.

Each record should include:

- Date
- Duration
- Mode
- Players
- Winner
- Placements
- Rounds
- Targets
- Moves
- Power-ups used
- Rewards earned

  15.15 Settings screen

Include:

- Master volume
- Music volume
- Sound effect volume
- Vibration
- Reduced motion
- High contrast
- Language
- Theme
- Reset progress
- Clear match history
- Privacy information
- Credits

⸻

16. Animation System

Animations must be energetic but not overwhelming.

16.1 Core animations

- Button squash on press
- Number bounce on change
- Counter flip or roll
- Player card pulse on active turn
- Timer shake under three seconds
- Danger meter glow
- Power-up activation burst
- Elimination screen shake
- Avatar knockback
- Winner entrance
- Reward chest pop
- Coin count animation
- XP bar fill
- Achievement unlock banner

  16.2 Reduced motion

When reduced motion is enabled:

- Remove screen shake
- Remove large movement transitions
- Replace particle bursts with fades
- Shorten counter animation
- Keep state changes understandable

⸻

17. Sound and Haptics

Create a centralized sound manager.

17.1 Sound categories

- Button press
- Counter increment
- Turn start
- Timer warning
- Power-up use
- Danger warning
- Target hit
- Life lost
- Elimination
- Round start
- Victory
- Reward claim
- Achievement unlock

  17.2 Music

Create or use royalty-free original-style music.

Suggested tracks:

- Main menu
- Standard match
- Danger phase
- Victory
- Rewards

Do not use copyrighted game music.

17.3 Haptic feedback

Use vibration where supported:

- Light vibration on button press
- Medium vibration at danger warning
- Strong vibration on elimination
- Celebration pattern on victory

Respect user settings and browser limitations.

⸻

18. State Management

Separate state into clear stores.

18.1 Profile store

Contains:

- User profile
- Progression
- Currencies
- Cosmetics
- Achievements
- Challenges
- Settings

  18.2 Match setup store

Contains:

- Players
- Mode
- Match settings
- Presets

  18.3 Active match store

Contains:

- Match ID
- Current round
- Counter
- Secret target
- Active player
- Player order
- Move history
- Round history
- Match status
- Timers
- Pending effects

  18.4 UI store

Contains:

- Active modal
- Toasts
- Reduced motion
- Current theme
- Navigation state
- Sound state

  18.5 Persistence

Persist:

- Profile
- Cosmetics
- Settings
- Challenges
- Statistics
- Match history
- Incomplete active match

Do not persist temporary animation state.

⸻

19. Game Engine Architecture

The game engine must remain independent from React.

Suggested structure:

src/
├── app/
├── components/
├── features/
│ ├── game/
│ ├── players/
│ ├── power-ups/
│ ├── progression/
│ ├── cosmetics/
│ ├── challenges/
│ └── statistics/
├── game-engine/
│ ├── engine.ts
│ ├── reducer.ts
│ ├── rules.ts
│ ├── target-generator.ts
│ ├── move-validator.ts
│ ├── power-up-resolver.ts
│ ├── bot-strategy.ts
│ ├── scoring.ts
│ └── types.ts
├── stores/
├── hooks/
├── lib/
├── config/
├── styles/
├── assets/
└── tests/

19.1 Engine commands

The engine should accept commands such as:

type GameCommand =
| { type: "START_MATCH" }
| { type: "START_ROUND" }
| { type: "SUBMIT_MOVE"; playerId: string; amount: number }
| { type: "USE_POWER_UP"; playerId: string; powerUpId: string }
| { type: "TURN_TIMEOUT"; playerId: string }
| { type: "CONTINUE_AFTER_LOSS" }
| { type: "PAUSE_MATCH" }
| { type: "RESUME_MATCH" }
| { type: "ABANDON_MATCH" };

19.2 Engine events

The engine should produce events such as:

type GameEvent =
| { type: "MATCH_STARTED" }
| { type: "ROUND_STARTED" }
| { type: "COUNTER_CHANGED"; value: number }
| { type: "DANGER_LEVEL_CHANGED"; level: DangerLevel }
| { type: "TARGET_HIT"; playerId: string }
| { type: "LIFE_LOST"; playerId: string }
| { type: "PLAYER_ELIMINATED"; playerId: string }
| { type: "POWER_UP_USED"; playerId: string; powerUpId: string }
| { type: "TURN_CHANGED"; playerId: string }
| { type: "MATCH_FINISHED"; winnerId: string };

19.3 Deterministic testing

Allow seeded random generators during tests.

The production game may use secure random generation, while tests should inject predictable sequences.

⸻

20. Danger Indicator

The danger indicator should create suspense without revealing the target.

Suggested levels:

- Safe
- Caution
- Danger
- Critical

Calculate the level based on approximate proximity to the target.

Add slight randomized uncertainty so players cannot reverse-engineer the exact number.

Example:

function calculateDangerLevel(
current: number,
target: number,
uncertainty: number
): DangerLevel;

When hidden danger mode is enabled, do not show any indicator.

⸻

21. Turn Timer

The timer must:

- Pause during animations
- Pause when a modal is open
- Resume correctly
- Trigger one action only
- Prevent duplicate timeout handling
- Visually warn at three seconds
- Support disabled mode

Timeout behavior should be configurable:

- Apply +1 automatically
- Skip turn
- Lose one point
- Lose one life
- Random move

Default:

- Automatically apply +1

⸻

22. Statistics

Track per-player and global statistics.

22.1 Match statistics

- Moves made
- Total clicks
- Average move
- Largest move
- Power-ups used
- Shields triggered
- Danger turns survived
- Rounds survived
- Lives lost
- Time spent deciding
- Placement

  22.2 Lifetime statistics

- Matches played
- Matches won
- Win rate
- Total rounds
- Total clicks
- Average clicks per match
- Most common move
- Highest win streak
- Longest survival streak
- Fastest win
- Longest match
- Most used game mode
- Most used avatar
- Power-up success rates

⸻

23. Accessibility

Meet WCAG 2.2 AA where practical.

Requirements:

- Keyboard navigation
- Visible focus states
- Screen-reader labels
- High contrast
- Large touch targets
- Reduced motion
- Captions or visual equivalents for important sounds
- Do not rely only on color
- Minimum readable font size
- Support browser zoom
- Use meaningful button labels
- Announce active player changes
- Announce counter changes
- Announce eliminations
- Provide confirmation before destructive actions

⸻

24. Progressive Web App

Make Numera installable.

Include:

- Web app manifest
- App icons
- Theme color
- Splash screens
- Offline application shell
- Service worker
- Cached static assets
- Offline local multiplayer
- Update notification
- Install prompt support

The game must remain playable offline after the first successful load.

⸻

25. Data Models

25.1 Match settings

interface MatchSettings {
mode: GameMode;
startingLives: number;
targetRange: {
min: number;
max: number;
};
maxMove: number;
turnTimerSeconds: number | null;
timeoutBehavior: TimeoutBehavior;
randomizePlayerOrder: boolean;
dangerIndicatorEnabled: boolean;
powerUpsEnabled: boolean;
specialEventsEnabled: boolean;
adaptiveTargetRange: boolean;
botDifficulty: BotDifficulty;
}

25.2 Active match

interface ActiveMatch {
id: string;
status: MatchStatus;
settings: MatchSettings;
players: Player[];
playerOrder: string[];
activePlayerIndex: number;
currentRound: number;
counter: number;
target: number;
moveHistory: MoveRecord[];
roundHistory: RoundRecord[];
startedAt: string;
completedAt?: string;
winnerId?: string;
}

25.3 Move record

interface MoveRecord {
id: string;
round: number;
playerId: string;
selectedAmount: number;
appliedAmount: number;
counterBefore: number;
counterAfter: number;
reachedTarget: boolean;
powerUpUsed?: string;
timestamp: string;
}

⸻

26. Error Handling

Handle:

- Storage failures
- Corrupted save data
- Invalid match configuration
- Unexpected page refresh
- Browser audio restrictions
- Unsupported vibration
- Animation interruption
- Duplicate turn submission
- Timer race conditions
- Empty player list
- Too few active players
- Invalid persisted match
- PWA update conflicts

Create:

- Error boundary
- Recovery screen
- Reset local data option
- Automatic data migration
- Safe defaults

⸻

27. Security and Fairness

Even for local mode:

- Validate all game commands.
- Prevent invalid moves.
- Do not trust UI state alone.
- Keep game engine rules centralized.
- Prevent duplicate action processing.
- Sanitize player names.
- Avoid dangerous HTML rendering.
- Use safe storage parsing.
- Do not expose secrets through logs in production.

For future online mode:

- Generate target server-side.
- Validate every move server-side.
- Use room authentication tokens.
- Add rate limits.
- Reconnect players safely.
- Prevent spectators from seeing hidden targets.
- Store authoritative state on the server.

⸻

28. Performance Requirements

Targets:

- Initial page load under three seconds on a normal mobile connection
- Gameplay interactions respond within 100 milliseconds
- Stable 60 FPS for normal animations
- No unnecessary full-page rerenders
- Lazy-load nonessential screens
- Optimize images
- Preload important sounds
- Keep bundle size controlled
- Avoid loading all cosmetics at startup
- Virtualize large history lists if needed

⸻

29. SEO and Metadata

Although Numera is primarily an application, include:

- Page title
- Description
- Open Graph tags
- Social preview image
- Favicon
- App icons
- Canonical metadata
- Structured data where appropriate
- Privacy page
- Terms page
- About page

Suggested description:

“Numera is a fast multiplayer number survival game. Take turns, choose your move, avoid the secret number, and become the last player standing.”

⸻

30. Testing Strategy

30.1 Unit tests

Test:

- Target generation
- Move validation
- Turn rotation
- Life deduction
- Elimination
- Match completion
- Score calculation
- Power-up resolution
- Bot decisions
- Danger calculation
- Timer behavior
- Challenge progress
- XP calculation
- Level calculation
- Trophy calculation
- Persistence migrations

  30.2 Integration tests

Test:

- Complete match flow
- Multi-life match
- Score mode
- Power-up use
- Timeout
- Player elimination
- Winner rewards
- Match history saving
- Challenge completion
- Profile progression

  30.3 End-to-end tests

Using Playwright, test:

1. Open app
2. Complete onboarding
3. Add players
4. Configure match
5. Start match
6. Complete several turns
7. Eliminate players
8. Finish match
9. Verify winner screen
10. Verify rewards
11. Start rematch
12. Reload page
13. Restore match
14. Install PWA where supported

30.4 Edge cases

Test:

- Two-player match
- Ten-player match
- Target reached during multi-click animation
- Shield used on target
- Last two players eliminated incorrectly
- Timer expiring during animation
- Page refreshed during a turn
- Counter pushback at zero
- Repeated Reverse power-ups
- Scramble with two players
- Bot-only simulation
- All players having identical names
- Storage unavailable
- Reduced motion
- Sound disabled

⸻

31. Development Stages

Stage 1 — Repository and foundation

Tasks:

- Create Next.js TypeScript project
- Configure strict TypeScript
- Configure Tailwind CSS
- Configure ESLint and Prettier
- Configure testing
- Establish directory structure
- Add environment example file
- Add initial README
- Add contribution rules
- Add coding standards
- Add CI workflow

Completion criteria:

- Application runs
- Lint passes
- Type checking passes
- Test command passes
- Build passes

Stage 2 — Design system

Tasks:

- Create color tokens
- Create typography scale
- Create spacing tokens
- Create shadows and borders
- Create buttons
- Create cards
- Create modals
- Create progress bars
- Create badges
- Create player chips
- Create animation utilities
- Create responsive layout primitives

Completion criteria:

- Component showcase page exists
- Components work on mobile and desktop
- Keyboard navigation works
- No copied third-party game assets

Stage 3 — Game engine

Tasks:

- Define game types
- Build target generator
- Build match initializer
- Build turn rotation
- Build move processor
- Build life and elimination logic
- Build winner detection
- Build round reset
- Add seeded randomness
- Add unit tests

Completion criteria:

- Full matches can run through tests without UI
- All core engine tests pass
- Engine contains no React dependencies

Stage 4 — Player and match setup

Tasks:

- Build player creation
- Build avatar selector
- Build color selector
- Build player reordering
- Build bot creation
- Build match presets
- Build advanced settings
- Validate configuration
- Persist recent setup

Completion criteria:

- Host can configure and start a valid match
- Invalid configurations cannot start

Stage 5 — Core gameplay UI

Tasks:

- Build pass-the-phone screen
- Build active player display
- Build counter
- Build move buttons
- Build player order
- Build life indicators
- Build timer
- Build round state
- Build match log
- Connect UI to engine

Completion criteria:

- A complete Classic match is playable
- Refresh recovery works
- No duplicate moves can occur

Stage 6 — Elimination and victory experience

Tasks:

- Build target-hit sequence
- Build life-loss sequence
- Build elimination animation
- Build round summary
- Build winner screen
- Build final ranking
- Build rematch flow
- Build return-home flow

Completion criteria:

- Match ending feels complete
- Rewards are not yet required but result data is accurate

Stage 7 — Power-ups

Tasks:

- Build power-up models
- Build inventory UI
- Implement initial power-ups
- Add power-up animations
- Add balance restrictions
- Add power-up tests
- Add power-up match logs

Completion criteria:

- Every power-up has working behavior
- No power-up can corrupt turn order or match state

Stage 8 — Additional game modes

Tasks:

- Multi-Life
- Score Rush
- Reverse Countdown
- Sudden Death
- Team Battle
- Chaos Mode

Completion criteria:

- Each mode has rules, UI explanation, tests, and winner calculation

Stage 9 — Profile and progression

Tasks:

- Build local profile
- Build XP
- Build levels
- Build coins
- Build trophies
- Build leagues
- Build profile screen
- Persist progress
- Add migration system

Completion criteria:

- Completing a match updates progression correctly
- Refresh does not lose progress

Stage 10 — Challenges and achievements

Tasks:

- Build daily challenge generation
- Build weekly challenges
- Build achievement definitions
- Build progress tracking
- Build reward claiming
- Build challenge screen
- Build achievement notifications

Completion criteria:

- Challenges update from real gameplay events
- Rewards cannot be claimed twice

Stage 11 — Cosmetics

Tasks:

- Build cosmetic data model
- Build inventory
- Build shop
- Build unlock requirements
- Build equip behavior
- Build initial cosmetic content
- Build preview system
- Apply cosmetics during gameplay

Completion criteria:

- Cosmetics change presentation
- Cosmetics do not change gameplay power

Stage 12 — Statistics and history

Tasks:

- Build match history
- Build lifetime stats
- Build player comparisons
- Build statistics screen
- Add data export
- Add history deletion

Completion criteria:

- Statistics are derived from real match data
- History supports at least 50 matches

Stage 13 — Sound, music, and haptics

Tasks:

- Build sound manager
- Add sound effects
- Add background music
- Add volume controls
- Add vibration
- Add browser audio unlock handling
- Add reduced sensory mode

Completion criteria:

- Sound settings persist
- Game works fully without audio

Stage 14 — PWA and offline support

Tasks:

- Add manifest
- Add icons
- Add service worker
- Add offline shell
- Cache required assets
- Add update flow
- Test installation

Completion criteria:

- App can be installed
- Local multiplayer works offline after initial load

Stage 15 — Accessibility and responsiveness

Tasks:

- Test keyboard navigation
- Test screen-reader labels
- Add announcements
- Improve focus management
- Test high contrast
- Test reduced motion
- Test major device sizes
- Test portrait and landscape

Completion criteria:

- Core flows are accessible
- No gameplay action requires precise small tapping

Stage 16 — Quality assurance

Tasks:

- Run all unit tests
- Run integration tests
- Run end-to-end tests
- Fix visual bugs
- Fix mobile overflow
- Fix race conditions
- Test refresh recovery
- Test corrupted storage
- Test browsers
- Remove debug logs
- Remove dead code
- Audit dependencies

Completion criteria:

- Lint passes
- Type check passes
- Tests pass
- Production build passes
- No known critical bugs

Stage 17 — Deployment and launch

Tasks:

- Configure Vercel
- Configure production environment
- Add analytics with privacy consideration
- Add error monitoring
- Add metadata
- Add legal pages
- Deploy preview
- Test production build
- Deploy production
- Verify PWA
- Create release notes

Completion criteria:

- Production URL works
- Game is playable on real mobile devices
- No console errors during standard play

⸻

32. Required Documentation

Create and maintain:

docs/
├── idea.md
├── plan.md
├── specs.md
├── architecture.md
├── game-rules.md
├── game-engine.md
├── design-system.md
├── gamification.md
├── power-ups.md
├── game-modes.md
├── state-management.md
├── data-models.md
├── accessibility.md
├── testing.md
├── deployment.md
├── security.md
├── performance.md
├── roadmap.md
├── known-issues.md
├── decisions.md
└── changelog.md

Update relevant documentation after every stage.

⸻

33. Git Workflow

Use feature branches where practical.

Suggested branch naming:

feature/game-engine
feature/player-setup
feature/power-ups
feature/progression
fix/timer-race-condition
test/game-engine-edge-cases

Commit after every meaningful completed change.

Examples:

chore: initialize Next.js project
feat: add core game engine types
feat: implement target generation
test: cover turn rotation edge cases
feat: add local player setup
feat: add elimination animation
fix: stop counter after target hit
docs: update stage 5 implementation notes

Do not combine unrelated changes into one large commit.

⸻

34. Definition of Done

The project is complete only when:

- The complete match flow works
- At least six game modes work
- Local multiplayer works
- Bots work
- Power-ups work
- Profiles work
- Progression works
- Coins and trophies work
- Challenges work
- Achievements work
- Cosmetics work
- Statistics work
- Match history works
- Sound and haptics work
- Offline mode works
- PWA installation works
- Mobile responsiveness works
- Accessibility requirements are addressed
- Unit tests pass
- Integration tests pass
- End-to-end tests pass
- TypeScript passes
- Lint passes
- Production build passes
- Documentation is complete
- The application is deployed
- No critical known issues remain
- No unfinished placeholder interactions remain

⸻

35. Final Claude Instructions

Before writing code:

1. Read this entire plan.
2. Inspect the complete repository.
3. Read all existing documentation.
4. Identify existing code and dependencies.
5. Do not delete useful existing work.
6. Create a brief repository assessment.
7. Create or update docs/tasks.md.
8. Break the current stage into small tasks.
9. Begin with Stage 1 unless the repository already satisfies it.

During development:

- Work stage by stage.
- Complete one stage before beginning the next.
- Do not skip tests.
- Do not skip responsive behavior.
- Do not use copyrighted assets.
- Do not copy Brawl Stars directly.
- Use only broad inspiration from energetic cartoon battle-game presentation.
- Build a unique Numera visual identity.
- Do not leave placeholder buttons.
- Do not claim a feature is complete unless it works.
- Fix errors before moving forward.
- Keep the application runnable after every commit.
- Update documentation and changelog continuously.
- Explain how to test every completed stage.
- Run lint, type checking, tests, and production build after each major stage.

At the end of each stage, provide:

1. Summary of completed work
2. Files created
3. Files modified
4. Architecture decisions
5. Tests added
6. Commands executed
7. Test results
8. Manual testing instructions
9. Known limitations
10. Recommended next stage

The final result must be a complete, polished, original, gamified, production-ready game named Numera.
