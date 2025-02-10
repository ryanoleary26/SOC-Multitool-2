# SOC Multitool V2
SOC Multitool V2 is a browser extension built for Security Operations Center (SOC) analysts and cybersecurity professionals. It streamlines investigations by providing instant access to multiple security tools for IP addresses, domains, and URLs directly from any webpage. Customize your toolset for maximum efficiency and convenience.  

The original [SOC Multitool extension written by zdhenard42](https://github.com/zdhenard42/SOC-Multitool) inspired this project to make the tool more configurable and accessible to the wider infosec industry. 

## Features  
- **Quick Access to Security Tools**: Right-click to query multiple security services for IP and domain information.  
- **Customizable Tool List**: Easily add, edit, and manage your own tools.  
- **Multi-Mode and Single-Mode Support**: Open one tool at a time or query multiple tools simultaneously.  
- **Persistent Configuration**: Saves settings using Chrome local storage.  
- **Icons for Improved UX**: Integrated Font Awesome icons for buttons and visual clarity.  

## How to Use  
1. **Install the Extension**  
   Add SOC Multitool V2 to your browser or load it as an unpacked extension for development.  

2. **Right-Click and Query**  
   Highlight an IP address or domain, right-click, and select **SOC Multitool v2** to query it with your configured tools.  

3. **Configure Tools**  
   - Go to the options page to manage your tools.  
   - Add new tools by specifying a name, URL, and mode (multi/single).  
   - The URL you provide must be able to accept data within the URL. E.g. https://www.virustotal.com/gui/ip-address/117.242.119.66

4. **Edit and Remove Tools**  
   Modify or remove tools from the options page as needed.  

## Example Configuration  
- **Tool Name**: Whois Lookup  
- **Tool Mode**: Multi  
- **Tool URLs**:  
  - `https://www.whois.com/whois/`  
  - `https://whois.domaintools.com/`  


  ```
  {
      "name": "IP Info",
      "mode": "multi",
      "urls": [
        {
          "name": "whois.com",
          "link": "https://www.whois.com/whois/"
        },
        {
          "name": "DomaiNTools WhoIs",
          "link": "https://whois.domaintools.com/"
        }
      ]
    }
  ```

## Development Notes  
- The extension stores configuration in `chrome.storage.local` under `toolConfig`.  

## Development Notes  
- Add placeholder functionality within tool URLs that allows for selected text to be inserted at a user specified URL location. E.g. https://yourdomain.com/{selected-text}/page1/subpage2
- Add import/export of tool configurations?

---