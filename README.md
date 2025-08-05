# Monitoring

The Monitoring Application enables users to set up and manage monitors with specific Areas of Interest (AOI) to track newly acquired imagery and events. This tool uses the Monitoring API. The application allows users to define custom criteria for monitoring, receive notifications when matching events occur, and manage their existing monitors through an interactive interface.

The use case guiding the application design was real estate site monitoring. The application can store the address, business name, and retail segment of the building being monitored. The analyst using this app would probably not be a platform user with their own account, so we demonstrate storing an external user ID in the monitor metadata. While we could have displayed the imagery on an interactive map using the WMS endpoints, this concept was already demonstrated in the Streaming Search sample application. To present an alternative API, the application uses the Get Browse Image endpoint which returns low resolution preview images instead.

## Jupyter Notebook

A companion Jupyter Notebook demonstrates working with the Monitoring APIs in Python. It's not intended to duplicate the real estate use case, but provides a good starting point to learn how to interact with the different endpoints in the Monitoring API.


## Features

- **Framework:** Built using Vue 3 and Vuetify 3 for a responsive and modern UI.
- **State Management:** Utilizes custom state management.
- **Routing:** Includes Vue Router for single-page application navigation.
- **Build Tool:** Powered by Vite for fast development and build processes.

## Installation

Node.js and npm Installation Guide

### Windows and macOS Installation

1. **Download Node.js**  
   - Go to the [Node.js download page](https://nodejs.org/) and download the latest **LTS** (Long-Term Support) version, which includes npm.

2. **Install Node.js**  
   - Open the downloaded installer and follow the installation prompts.  
   - This will install both Node.js and npm.

3. **For Additional Guidance**  
   - Visit the official [Node.js Documentation](https://nodejs.org/en/docs/) for more information on setup and usage.

### Linux Installation

For Linux, you can install Node.js and npm via a package manager (like `apt` for Debian/Ubuntu, or `dnf` for RHEL/Fedora), or directly using `nvm` (Node Version Manager) for easier version control.

#### Using a Package Manager

- **Debian/Ubuntu**:
    ```
    sudo apt update
    sudo apt install -y nodejs npm
    ```

    ```
    # Run this to check if NodeJS and NPM are installed and verify the version

    node -v   # This should display the Node.js version
    npm -v    # This should display the npm version
    ```

## Setup Instructions

1. **Clone the Repository**

    Clone the project to your local machine:
    ```
    git clone https://github.com/Maxar-Public/mgp-monitoring-events.git
    ```

2. **Install Dependencies**

    Install the necessary dependencies using npm:
    ```
    npm install
    ```
    (You can also use `yarn install` or `pnpm install`.)

## Usage

### Development Server

To start the development server:
```
npm run dev
```

This will launch the application at `http://localhost:3000`.

**Note:** To run this command and any other command you need to locate yourself where the project is; otherwise, it will throw an error.

### Build for Production

To create an optimized production build:
```
npm run build
```

### Run Tests

Run the project unit tests using Vitest:
```
npm run test
```

## About the Monitoring Application

### Overview

The **Monitoring Application** is a Vue.js-based tool that enables users to set up and manage monitors for tracking newly acquired imagery and events in specific Areas of Interest (AOI). This documentation outlines the application's capabilities, API endpoints, and key features.

### Key Features

#### 1. Monitor Management

- Create monitors with custom parameters  
- Define Areas of Interest (AOI) using GeoJSON
- Set match criteria for cloud cover, off-nadir angle, and platforms
- Enable/disable existing monitors  
- View and edit monitor details  

#### 2. Map Visualization

- Interactive map interface for defining and viewing AOIs  
- Visualization of monitor coverage areas
- Spatial data representation 

#### 3. Event Tracking

- Event feed displaying all events from active monitors
- Filtering and sorting capabilities for events
- Detailed metadata for each event

#### 4. User Authentication

- Simulates an external identity system   
- User-specific monitor management

#### 5. Demo Mode

- Sample data shows simulated monitors and images to demonstrate functionality before real monitors are set up and matching images

## API Endpoints

Based on the available code, the application likely interacts with the following endpoints:

### Monitor Management

- `GET /monitors` – Retrieve all monitors for the authenticated user  
- `POST /monitors` – Create a new monitor  
- `GET /monitors/{id}` – Get details for a specific monitor  
- `PUT /monitors/{id}` – Update an existing monitor  
- `DELETE /monitors/{id}` – Delete a monitor  

### Event Tracking

- `GET /events` – Retrieve all events  
- `GET /monitors/{id}/events` – Get events for a specific monitor  
- `GET /events/{id}` – Get detailed information about a specific event  

### Browse Imagery

- `GET /browse-archive/v1/browse/show` - Get a browse image (a lower-resolution preview)

