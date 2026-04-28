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
  venueName: 'The Sample Venue',
  venueLocation: '123 Example Street, London, EC1A 1AA, United Kingdom',
  isOnline: false,
  imageUrl:
    'https://res.cloudinary.com/ticket-tailor/image/upload/v1744709898/production/userfiles/global/base-square-1.jpg',
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
