from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import time
import os

def scrape_linkedin_profile(target_url: str):
    email = os.getenv("SCRAPER_EMAIL")
    password = os.getenv("SCRAPER_PASSWORD")
    
    # If no credentials, return mock data to prevent crash
    if not email or not password:
        print("Scraper Error: Missing SCRAPER_EMAIL or SCRAPER_PASSWORD in .env")
        return None

    options = webdriver.ChromeOptions()
    # options.add_argument("--headless") # Keep browser visible to debug login
    
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

    try:
        driver.get("https://www.linkedin.com/login")
        time.sleep(3)
        driver.find_element(By.ID, "username").send_keys(email)
        driver.find_element(By.ID, "password").send_keys(password)
        driver.find_element(By.ID, "password").send_keys(Keys.RETURN)
        time.sleep(15) # Wait long for manual captcha if needed

        driver.get(target_url)
        time.sleep(5)
        
        # Scroll to load data
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight/2);")
        time.sleep(2)

        soup = BeautifulSoup(driver.page_source, "html.parser")
        
        # Simple Extraction
        name_tag = soup.find('h1', {'class': 'text-heading-xlarge'})
        name = name_tag.get_text().strip() if name_tag else "Unknown User"
        
        about_tag = soup.find('div', {'class': 'display-flex ph5 pv3'})
        about = about_tag.get_text().strip() if about_tag else ""

        return {
            "raw_text": f"Name: {name}\nAbout: {about}",
            "name": name
        }

    except Exception as e:
        print(f"Scraping Error: {e}")
        return None
    finally:
        driver.quit()