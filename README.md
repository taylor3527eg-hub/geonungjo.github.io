# Portfolio

The portfolio homepage starts at `index.html`.
It includes a white-background hero, Engineering & Music, About & Vision, and a contact footer.
The Robotic Stompbox is integrated directly into the hero section.

## Getting Started

1. Open the `portfolio` folder on your desktop in VS Code.
2. Right-click the root `index.html` file and select **Open with Live Server**.
3. Try the parameter sliders and cursor-driven force interaction, and check the pedal LED and musical notes in the browser.

The site uses JavaScript modules, so run it through Live Server instead of opening the HTML file directly.

## Project Structure

- `index.html`: Homepage structure and feature placement
- `style.css`: Shared homepage styles
- `script.js`: Homepage feature initialization
- `assets/`: Shared images and other site assets
- `features/robotic-stompbox/script.js`: Robot dynamics and interaction module
- `features/robotic-stompbox/style.css`: Styles scoped to the robot interaction
- `features/robotic-stompbox/assets/`: Original images used by the robot interaction

## Robotic Stompbox Integration

The homepage's `script.js` passes the interaction container to `initRoboticStompbox`.
The feature runs in the same document without an iframe.
Images are loaded relative to the module file, while input handling and styles are scoped to the interaction container.
To move the feature elsewhere on the page, relocate the `data-robotic-stompbox` section in `index.html`.
To remove the feature dynamically, call the `destroy()` method returned by the initializer.

The existing layout, physics parameters, pedal ON/OFF behavior, red LED, and musical-note settings have been preserved.
The site has not been published yet.

The original `robotic-stompbox` folder on the desktop is retained as an archive. Use the `portfolio` folder for further development and local previews.

## Homepage Sections

- Navigation: WORK / ABOUT & VISION / CONTACT
- Hero: Introduction and a compact Robotic Stompbox
- WORK: Photographs and descriptions of three engineering projects and two music activities
- ABOUT & VISION: A brief vision connecting research and music
- CONTACT: Email address and copyright notice

The project cards use five original photographs from `assets/Home`. Clicking a photograph opens the full image in a lightbox, which can be closed using the close button, the Esc key, or a click outside the image.
Keep the interaction's feature files intact and adjust its display size through the homepage's `style.css`.
