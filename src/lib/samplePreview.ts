import type { EventbritePreview } from './eventbrite';

// Placeholder preview shown before the user pastes a URL so the page doesn't
// look empty. Branded "Your Eventbrite event goes here" so it's clearly a
// demo, with a generic stock image and a few mock occurrences/dates.
export const SAMPLE_PREVIEW: EventbritePreview = {
  name: 'Your Eventbrite event goes here',
  description:
    'Paste any public Eventbrite URL above to preview your event on Ticket Tailor. Switch themes from the left to find the look you like best.',
  startDate: nextSaturdayAt(19, 0).toISOString(),
  endDate: nextSaturdayAt(22, 0).toISOString(),
  timezone: null,
  venueName: 'Ticket Tailor HQ',
  venueLocation: 'Unit 219, Mare Street Studios, 203-213 Mare Street, London, E8 3LY',
  isOnline: false,
  imageUrl:
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=2000&q=80&auto=format&fit=crop',
  imageUrls: [
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=2000&q=80&auto=format&fit=crop'
  ],
  sourceUrl: 'https://www.eventbrite.com',
  isSeries: true,
  organizerName: 'Your event brand',
  occurrences: [
    { start: nextSaturdayAt(19, 0).toISOString(), end: nextSaturdayAt(22, 0).toISOString() },
    {
      start: nextSaturdayAt(19, 0, 7).toISOString(),
      end: nextSaturdayAt(22, 0, 7).toISOString()
    },
    {
      start: nextSaturdayAt(19, 0, 14).toISOString(),
      end: nextSaturdayAt(22, 0, 14).toISOString()
    },
    {
      start: nextSaturdayAt(19, 0, 21).toISOString(),
      end: nextSaturdayAt(22, 0, 21).toISOString()
    }
  ],
  priceRange: { currency: 'GBP', min: 15, max: 35, isFree: false }
};

function nextSaturdayAt(hour: number, minute: number, addDays = 0): Date {
  const d = new Date();
  const daysUntilSat = (6 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilSat + addDays);
  d.setHours(hour, minute, 0, 0);
  return d;
}
