## Inspiration

SenseNav comes from the words "sensing" and "navigation". This application allows blind users to have a portable, affordable and multi-modal way to explore and navigate maps.

**Current alternative systems include:**

**Accessible Google Maps extension: Reads out loud map components.**

Downsides:
- Not multi-modal, can be difficult to gain a spacial understanding with only audio directions.
- Lacking technology to summarize information
- Lacking an "exploration" feel

**Braille Devices: Can display map components in a multi-modal fashion (audio + haptic feedback).**

Downsides:
- Braille devices are expensive, limiting access to only a small part of the low-vision community
- Braille devices are often not portable

## What it does

NavSense accessible navigation tool for blind or low-vision users, empowering them to navigate public spaces with more independence and confidence.

**Audio and Haptic Feedback**: Dragging a finger on points of interest generates a vibration. The path from the current location to a final destination can also be felt with vibration feedback.

**AI-Powered Summaries**: Uses Google’s Vertex AI Model to generate concise summaries of google reviews.

The app has four main capabilities for each point of interest. The points of interests are filtered in 4 categories: Restaurants, Metros, Health (e.g. hospitals) and Visit (e.g. museums).

- **Summary:** Executive summary of the point of interest
- **Reviews:** Summarizing Google Reviews for that point of interest
- **Accessibility:** Summarizing Accessibility concerns highlighted in Google Reviews
- **Directions:** Offers readable explanations of routes along with a haptic vibration path from the source to the destination for enhanced spacial awareness

## Technologies

The mobile application was built using **React-Native**.

The back-end was built using Flask and is powered by the following **Google Cloud APIs**: Google Vertex AI Model, Google Direction API and Google Maps API.

The Google Maps API was used to render the map on the screen with specific points of interests filtered based on the buttons on the top sreen. The Vertex AI Model was used to generate summaries of map directions and Google Reviews.

## What's next for NavSense

- Replace button with a Speech Assistant
- Verify validity and relevance of Generative AI summaries
