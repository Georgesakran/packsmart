# PackSmart

**Smart suitcase planning for travelers.**

PackSmart is a travel packing web app that helps users estimate suitcase capacity, manage luggage weight and volume, apply trip presets, add custom items, and receive a practical packing plan with layout preview and recommended packing order.

---

## Overview

Packing for travel is often stressful because people do not know:

- how much their suitcase can really hold
- whether their items will fit
- whether they are close to the airline weight limit
- how to organize items efficiently inside the suitcase

PackSmart solves this by giving users a smarter way to plan before they start packing.

Users can choose a suitcase, add clothing and travel items, include custom items, and instantly receive:

- volume and weight calculations
- fit / not fit estimation
- capacity progress bars
- packing advice
- recommended packing order
- suitcase layout preview
- printable packing plan

---

## Problem

Many travelers pack inefficiently and only realize problems at the last moment.

Common issues include:

- overpacking
- wasted suitcase space
- overweight luggage
- poor item arrangement
- uncertainty about what to take for different trip types

Most packing tools are only checklists. They do not help users estimate real suitcase usage or build a practical packing plan.

---

## Solution

PackSmart is designed as a smart suitcase planner.

It allows the user to:

1. choose a suitcase preset or create a custom suitcase
2. add items from a predefined list
3. add custom travel items manually
4. apply trip presets such as weekend or winter travel
5. calculate total estimated volume and weight
6. see whether the suitcase setup fits
7. receive practical packing advice
8. follow a recommended packing order
9. preview a simple suitcase layout
10. save and export the packing plan

---

## Main Features

### Suitcase Selection
- preset suitcase options
- custom suitcase dimensions
- automatic volume calculation for custom bags

### Item Management
- predefined travel items
- size-based items
- custom item support
- category filtering
- item search

### Trip Presets
- Weekend Trip
- 5-Day Summer Trip
- 7-Day Winter Trip
- Business Trip

### Packing Calculation
- total estimated volume
- total estimated weight
- remaining volume
- volume fit check
- weight fit check

### Smart Packing Support
- smarter packing advice
- recommended packing order
- simple suitcase layout preview
- capacity progress bars

### Session Management
- save packing sessions locally
- load previous sessions
- delete saved sessions

### Export
- print / export packing plan as PDF using browser print

---

## Tech Stack

### Frontend
- React
- React Router
- Axios
- CSS

### Backend
- Node.js
- Express.js

### Database
- MySQL

### Storage
- localStorage for saved sessions and temporary app state

---

## Project Structure

```bash
packsmart/
  client/
    src/
      components/
      data/
      pages/
      services/
      styles/
  server/
    config/
    controllers/
    routes/