# Leaderboard Feature

## Overview
The Leaderboard page displays weekly rankings for all leagues (Bronze, Silver, Gold, Platinum, Diamond) with real-time competition tracking.

## Components

### LeaderboardComponent
- **Path**: `features/leaderboard/leaderboard.component.ts`
- **Route**: `/leaderboard`
- **Features**:
  - League tabs for all 5 leagues
  - Top 30 + current user ranking
  - Promotion/demotion zone indicators
  - Current user highlighting
  - Responsive design
  - Loading and error states

## Key Features

### League System
- **Bronze**: Entry level
- **Silver**: Mid-tier
- **Gold**: Advanced
- **Platinum**: Expert
- **Diamond**: Elite

### Zone Indicators
- **Promotion Zone**: Top 10 users move up (green indicator)
- **Demotion Zone**: Bottom 5 users move down (red indicator)
- Visual badges show zone status

### Current User
- Highlighted with special styling (blue gradient)
- "Ви" (You) badge
- Always visible (even if outside top 30)

## Design
- Material Design tabs for league selection
- Responsive layout (mobile-first)
- Color-coded zones (green/red)
- Medals for top 3 (🥇🥈🥉)
- Weekly XP badges with star icons

## Integration

### Services Used
- `LeaderboardService`: API calls
- `AuthService`: Current user info

### Models
- `LeaderboardResponse`: Full leaderboard data
- `LeaderboardEntry`: Individual ranking entry
- `League`: Type definition

## Future Enhancements (US-039)
- [ ] SignalR real-time updates
- [ ] Live rank changes
- [ ] Achievement unlock notifications
- [ ] Weekly promotion/demotion animations

## Testing
- Component rendering
- Tab switching
- User highlighting
- Zone calculations
- Responsive behavior
