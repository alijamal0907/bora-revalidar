# Bora Revalidar

A modern spaced repetition learning platform that helps you master any subject through intelligent review scheduling.

## Features

✓ **Spaced Repetition Algorithm** - SM-2 algorithm implementation for optimal learning intervals
✓ **Interactive Study Sessions** - Flip cards, grade yourself, and track progress
✓ **Practice Simulations** - Test your knowledge with multiple-choice questions
✓ **Analytics Dashboard** - Track your learning journey with detailed statistics
✓ **Persistent Storage** - All your data is saved locally using browser storage
✓ **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

## Getting Started

### Local Development

1. Clone or download this project
2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Demo Login

For demo purposes, any email and password combination will work:
- Email: `demo@example.com`
- Password: `demo123`

## Architecture

### Technology Stack
- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui
- **Storage**: Browser localStorage (can be migrated to Supabase)
- **Charts**: Recharts for analytics visualization

### File Structure

\`\`\`
app/
├── layout.tsx                 # Root layout
├── page.tsx                   # Home (redirects to auth)
├── login/                     # Authentication
├── dashboard/                 # Main dashboard
├── study/                     # Flashcard study sessions
├── simulations/               # Practice simulations
└── review/                    # Analytics & progress
components/
├── navbar.tsx                 # Navigation bar
└── ui/                        # Reusable components
lib/
├── auth.ts                    # Authentication utilities
├── spaced-repetition.ts       # SM-2 algorithm implementation
└── storage.ts                 # Local storage management
\`\`\`

## How Spaced Repetition Works

The app uses the **SM-2 (SuperMemo 2)** algorithm, a proven method for optimal learning:

1. **Ease Factor**: Each card has an ease factor (1.3-2.5) that affects review intervals
2. **Quality Rating**: Rate your response 0-5:
   - 0-2: Need to review again (1-day interval)
   - 3: OK response (3-day interval)
   - 4-5: Good/Perfect response (extends interval based on ease factor)
3. **Dynamic Intervals**: Intervals grow exponentially for cards you master

## Study Session Workflow

1. **View Question**: See the flashcard question
2. **Reveal Answer**: Click to show the correct answer
3. **Self-Grade**: Rate your response (Again, Hard, Good, Easy, Perfect)
4. **Update Interval**: Algorithm calculates next review date
5. **Progress**: Move through your deck systematically

## Analytics Features

- **Progress Tracking**: Monitor total reviews and study streaks
- **Difficulty Distribution**: See breakdown of easy/medium/hard cards
- **Quality Insights**: Analyze your response quality over time
- **Category Performance**: Track performance by subject
- **Study Timeline**: 7-day activity chart

## Advanced Features

### Simulations Mode
Practice with multiple-choice questions shuffled from your deck:
- Instant feedback on answers
- Score calculation
- Retry options
- Performance tracking

### Export & Import
Currently data is stored locally. Future versions will support:
- Exporting progress as JSON
- Importing card decks
- Cloud synchronization

## Customization

### Adding Cards

Edit the default cards in `lib/spaced-repetition.ts`:

\`\`\`typescript
export function generateDefaultCards(): StudyCard[] {
  return [
    {
      id: 'card_1',
      question: 'Your question?',
      answer: 'Your answer',
      category: 'Category',
      difficulty: 'easy' | 'medium' | 'hard',
      // ... other fields
    },
    // Add more cards...
  ];
}
\`\`\`

### Theme Customization

Edit color tokens in `app/globals.css`:

\`\`\`css
:root {
  --primary: oklch(0.55 0.2 250);        /* Blue */
  --accent: oklch(0.62 0.18 140);        /* Green */
  --secondary: oklch(0.65 0.15 180);     /* Cyan */
}
\`\`\`

## Future Enhancements

- Backend integration with Supabase for cloud sync
- Social features and shared decks
- AI-powered question generation
- Spaced repetition for image/audio cards
- Offline support with service workers
- Integration with popular learning platforms

## Performance Tips

- Use reasonable deck sizes (50-500 cards initially)
- Study daily for best results
- Rate yourself honestly for accurate intervals
- Focus on problem areas first
- Review analytics regularly

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Data Privacy

- All data stored locally in your browser
- No server communication (in demo mode)
- Clear browser data to reset
- Export your data before clearing

## Troubleshooting

**Cards not saving?**
- Check browser localStorage is enabled
- Try clearing cache and reloading
- Check console for errors (F12)

**Study progress reset?**
- Browser cache cleared
- Private/incognito mode active
- Different browser/device used

**Cards showing "Due Now" but I just studied?**
- Browser time might be wrong
- Try reloading the page
- Check localStorage in DevTools

## License

Open source - feel free to use and modify!

## Support & Feedback

- Found a bug? Open an issue
- Have suggestions? Submit feedback
- Want to contribute? Pull requests welcome!

---

Happy studying with Bora Revalidar!
