# RuralSwift: Route Optimization & Speed Delivery Plan

To truly live up to the name **RuralSwift**, we need to transition from a standard e-commerce flow to a localized, hyper-efficient delivery network. Rural areas often lack structured addresses (like "Street 4, Block B"), making route optimization based on landmarks, GPS coordinates, and intelligent batching essential.

Here is a proposed 3-phase plan to build this out:

## Phase 1: Data Foundation & Delivery Persona
Currently, we have Customers and Sellers. We need to introduce the **Delivery Partner** and upgrade our location data.

1. **New User Role:** Add a `delivery` role to the `users` table so drivers can log in.
2. **Geospatial Data (GPS):** Add `latitude` and `longitude` columns to the `addresses` table (for customers) and `seller_profiles` (for the origin hub).
3. **Delivery Runs (Batching):** Create a new `delivery_runs` table. Instead of delivering one order at a time, the system will group 5-15 orders going to the same village/region into a single "Run" and assign it to a driver.

## Phase 2: The Optimization Engine (The "Brain")
Once we have coordinates and grouped orders, we need an algorithm to sort them into the fastest route (solving the Vehicle Routing Problem).

*   **Approach A (Simple/MVP): Distance-Based Sorting.** We calculate the straight-line distance (Haversine formula) from the Seller Hub to all delivery points. We sort the deliveries from closest to furthest.
*   **Approach B (Advanced/Impressive): Real Routing API.** We integrate a free routing engine like **OSRM (Open Source Routing Machine)** or **OpenRouteService**. This calculates actual road networks, dirt paths, and estimated driving times to give the absolute best delivery sequence.

## Phase 3: Delivery Dashboard & Interactive Map (UI)
We need a dedicated interface for the Delivery Partners to use on their phones while on the road.

1. **Driver Dashboard (`/delivery-hub`):** A mobile-first UI where drivers see their assigned "Delivery Run" for the day.
2. **Interactive Route Map:** We integrate **Leaflet.js** (a free, beautiful mapping library) to plot the Seller Hub and all delivery destinations on a map, drawing a line showing the optimized route.
3. **OTP Verification Integration:** When the driver reaches a house, they use the interface to input the Delivery OTP (which we built previously!) to complete the drop-off.
