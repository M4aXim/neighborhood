import Head from "next/head";
import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import styles from "@/styles/Home.module.css";
import dynamic from "next/dynamic";
import SignupComponent from "@/components/SignupComponent";
import RewardsComponent from "@/components/RewardsComponent";
import JournalComponent from "@/components/JournalComponent";
import BulletinComponent from "@/components/BulletinComponent";
import HackTimeComponent from "@/components/HackTimeComponent";
import NeighborhoodPopup from "@/components/NeighborhoodPopup";
import ChallengesComponent from "@/components/ChallengesComponent";
import PostComponent from "@/components/PostComponent";
import ShipComponent from "@/components/ShipComponent";
import AppsComponent from "@/components/AppsComponent";
import HomesComponent from "@/components/HomesComponent";
import PostsViewComponent from "@/components/PostsViewComponent";
import BrownStopwatchComponent from "@/components/BrownStopwatchComponent";
import SlackConnectionComponent from "@/components/SlackConnectionComponent";
import StatsDisplayComponent from "@/components/StatsDisplayComponent";
import TicketDropdown from "@/components/TicketDropdown";
import { useState, useEffect, useRef } from "react";
import { getToken, removeToken } from "@/utils/storage";
import { updateSlackUserData } from "@/utils/slack";
import AnimatedText from '../components/AnimatedText';

const NeighborhoodEnvironment = dynamic(
  () => import("@/components/NeighborhoodEnvironment"),
  { ssr: false },
);

export default function Home() {
  const isNewVersion = true;

  const [UIPage, setUIPage] = useState("");
  const [hasEnteredNeighborhood, setHasEnteredNeighborhood] = useState(false);
  const [selectedItem, setSelectedItem] = useState("start");
  const [isSignedIn, setIsSignedIn] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [userData, setUserData] = useState();
  const [token, setToken] = useState("");
  const [showNeighborhoodPopup, setShowNeighborhoodPopup] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [weatherTexture, setWeatherTexture] = useState("sunny.svg");
  const [currentTime, setCurrentTime] = useState("");
  const [isAM, setIsAM] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [connectingSlack, setConnectingSlack] = useState(false);
  const [slackUsers, setSlackUsers] = useState([]);
  const [searchSlack, setSearchSlack] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [inputtedSlackId, setInputtedSlackId] = useState("");
  const [inputtedGithubUsername, setInputtedGithubUsername] = useState("");
  const [latestPosts, setLatestPosts] = useState([]);
  const [showPostsView, setShowPostsView] = useState(false);
  const [isPostsViewExiting, setIsPostsViewExiting] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [showStopwatch, setShowStopwatch] = useState(false);
  const [isStopwatchExiting, setIsStopwatchExiting] = useState(false);
  const [ticketDropdown, setTicketDropdown] = useState(false);
  const [showHomesWindow, setShowHomesWindow] = useState(false);
  const [isHomesWindowExiting, setIsHomesWindowExiting] = useState(false);
  const jumpscarePlayedRef = useRef(false);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedAirport, setSelectedAirport] = useState('');
  const [hasVisa, setHasVisa] = useState(false);
  const [airports, setAirports] = useState([]);
  const [isLoadingAirports, setIsLoadingAirports] = useState(false);
  const [countries, setCountries] = useState([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [showCountrySelect, setShowCountrySelect] = useState(false);
  const [showAirportSelect, setShowAirportSelect] = useState(false);
  const [showVisaCheckbox, setShowVisaCheckbox] = useState(false);
  const [showSubmitButton, setShowSubmitButton] = useState(false);
  const [textComplete, setTextComplete] = useState(false);

  // Handle clicks outside profile dropdown and ticket dropdown

  useEffect(() => {
    setHasEnteredNeighborhood(false);
    const handleClickOutside = (event) => {
      const dropdown = document.getElementById("profile-dropdown");
      const profileImage = document.getElementById("profile-image");
      const ticketDropdown = document.getElementById("ticket-dropdown");
      const ticketButton = document.getElementById("ticket-button");

      if (
        dropdown &&
        profileImage &&
        !dropdown.contains(event.target) &&
        !profileImage.contains(event.target)
      ) {
        setProfileDropdown(false);
        setConnectingSlack(false);
      }

      if (
        ticketDropdown &&
        ticketButton &&
        !ticketDropdown.contains(event.target) &&
        !ticketButton.contains(event.target)
      ) {
        setTicketDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Prefill input values when userData is loaded
  useEffect(() => {
    if (userData) {
      setInputtedSlackId(userData.slackId || "");
      setInputtedGithubUsername(userData.githubUsername || "");
    }
  }, [userData]);

  // Update time in Animal Crossing format
  useEffect(() => {
    const updateACTime = () => {
      const now = new Date();
      // Get time in Los Angeles (Animal Crossing-style uses 12-hour format)
      const options = {
        timeZone: "America/Los_Angeles",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      };

      const timeString = new Intl.DateTimeFormat("en-US", options).format(now);

      // Split into time and AM/PM
      const [time, period] = timeString.split(" ");

      // Set states
      setCurrentTime(time);
      setIsAM(period === "AM");
    };

    // Update immediately and then every minute
    updateACTime();
    const intervalId = setInterval(updateACTime, 60000);

    return () => clearInterval(intervalId);
  }, []);
  const fetchWeather = async () => {
    const response = await fetch("https://wttr.in/SFO?format=%C&lang=en");
    const data = await response.text();
    console.log(data);
    console.log(classifyWeather(data));
    setWeatherTexture(`./${classifyWeather(data)}.svg`);
  };
  fetchWeather();

  const banjoSound = useRef(null);
  const backgroundMusic = useRef(null);

  function classifyWeather(condition) {
    const c = condition.toLowerCase();

    // Sunny or clear conditions
    if (
      c.includes("sun") ||
      c.includes("clear") ||
      c.includes("blazing") ||
      c.includes("bright")
    ) {
      return "sunny";
    }

    // Rainy or thunderstorm conditions
    if (
      c.includes("rain") ||
      c.includes("showers") ||
      c.includes("thunder") ||
      c.includes("drizzle") ||
      c.includes("sleet") ||
      c.includes("blizzard") ||
      c.includes("torrential")
    ) {
      return "rain";
    }

    // Cloudy or overcast conditions
    if (
      c.includes("cloud") ||
      c.includes("overcast") ||
      c.includes("mist") ||
      c.includes("fog") ||
      c.includes("haze") ||
      c.includes("freezing fog") ||
      c.includes("patchy snow") ||
      c.includes("blowing snow")
    ) {
      return "cloud";
    }

    // Default to "cloud" if not specifically categorized
    return "cloud";
  }

  useEffect(() => {
    const token = getToken();
    console.log(token);
    setIsSignedIn(!!token);

    // If user is signed in, update their Slack data
    if (token) {
      setIsLoading(true);
      updateSlackUserData(token)
        .then((data) => {
          setUserData(data);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Failed to update user data:", error);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }

    // Initialize audio
    banjoSound.current = new Audio("/banjo.mp3");
    backgroundMusic.current = new Audio("/littlething.mp3");
    backgroundMusic.current.loop = true;
  }, [hasEnteredNeighborhood]);

  useEffect(() => {
    if (isSignedIn && !UIPage && backgroundMusic.current) {
      if (!isMuted) {
        backgroundMusic.current.play();
      }
    } else if (backgroundMusic.current) {
      backgroundMusic.current.pause();
      backgroundMusic.current.currentTime = 0;
    }
  }, [UIPage, isSignedIn, isMuted]);

  const playBanjoSound = () => {
    if (banjoSound.current) {
      banjoSound.current.currentTime = 0;
      banjoSound.current.play();
    }
  };

  const handleLogout = () => {
    removeToken();
    window.location.reload();
  };

  const handleCloseComponent = () => {
    setIsExiting(true);
    setTimeout(() => {
      setUIPage("");
      setIsExiting(false);
    }, 300); // Match animation duration
  };

  const handleMenuItemClick = (itemId) => {
    playBanjoSound();
    setUIPage(itemId);
  };

  const menuItems = isNewVersion
    ? [
        { id: "post", text: "Post to the Block" },
        { id: "ship", text: "Ship New Release" },
        { id: "apps", text: "My Apps" },
      ]
    : [
        { id: "start", text: "Start Hacking" },
        { id: "challenges", text: "Challenges" },
        { id: "bulletin", text: "Bulletin" },

        // { id: 'journal', text: 'Journal' },
        // { id: 'rewards', text: 'Rewards' }
      ];

  // Fetch Slack users when connectingSlack becomes true
  useEffect(() => {
    if (connectingSlack) {
      fetch("/api/getSlackUsers")
        .then((res) => res.json())
        .then((data) => setSlackUsers(data.users || []))
        .catch(() => setSlackUsers([]));
    }
  }, [connectingSlack]);

  // Deduplicate Slack users by Slack ID
  const uniqueSlackUsers = [];
  const seenSlackIds = new Set();
  for (const user of slackUsers) {
    if (user.slackId && !seenSlackIds.has(user.slackId)) {
      uniqueSlackUsers.push(user);
      seenSlackIds.add(user.slackId);
    }
  }

  const toggleMute = () => {
    if (backgroundMusic.current) {
      if (isMuted) {
        backgroundMusic.current.play();
      } else {
        backgroundMusic.current.pause();
      }
      setIsMuted(!isMuted);
    }
  };

  // Fetch latest posts on mount
  useEffect(() => {
    const fetchLatestPosts = async () => {
      setIsLoadingPosts(true);
      try {
        // First fetch just the latest post for quick display
        const latestRes = await fetch("/api/getLatestPost");
        if (latestRes.ok) {
          const latestData = await latestRes.json();
          if (latestData.post) {
            setLatestPosts([latestData.post]);
          }
        }

        // Then fetch all posts in the background
        const allRes = await fetch("/api/getLatestPosts");
        if (allRes.ok) {
          const allData = await allRes.json();
          setLatestPosts(allData.posts || []);
        }
      } catch (e) {
        console.error("Error fetching posts:", e);
      } finally {
        setIsLoadingPosts(false);
      }
    };
    fetchLatestPosts();
  }, []);

  const handleClosePostsView = () => {
    setIsPostsViewExiting(true);
    setTimeout(() => {
      setShowPostsView(false);
      setIsPostsViewExiting(false);
    }, 300);
  };

  const handleCloseHomesWindow = () => {
    setIsHomesWindowExiting(true);
    setTimeout(() => {
      setShowHomesWindow(false);
      setIsHomesWindowExiting(false);
    }, 300);
  };

  useEffect(() => {
    const fetchAirports = async () => {
      if (!selectedCountry) return;
      
      setIsLoadingAirports(true);
      try {
        const response = await fetch(`/api/getAirports?country=${selectedCountry}`);
        if (!response.ok) throw new Error('Failed to fetch airports');
        const data = await response.json();
        setAirports(data.airports || []);
      } catch (error) {
        console.error('Error fetching airports:', error);
      } finally {
        setIsLoadingAirports(false);
      }
    };

    fetchAirports();
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedCountry === 'US') {
      setHasVisa(true);
    }
  }, [selectedCountry]);

  const handleSubmit = async () => {
    try {
      const token = getToken();
      if (!token) throw new Error('No authentication token found');
      const response = await fetch('/api/updateUserTravel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          country: selectedCountry,
          hasVisa: hasVisa,
          airport: selectedAirport
        }),
      });

      if (!response.ok) throw new Error('Failed to update user travel info');
      setShowWelcomePopup(false);
      // Directly update userData state
      setUserData(prev => ({
        ...prev,
        country: selectedCountry,
        hasVisa: hasVisa,
        airport: selectedAirport
      }));
    } catch (error) {
      console.error('Error updating user travel info:', error);
    }
  };

  // Add useEffect to fetch countries
  useEffect(() => {
    const fetchCountries = async () => {
      setIsLoadingCountries(true);
      try {
        const response = await fetch('/api/getCountries');
        if (!response.ok) throw new Error('Failed to fetch countries');
        const data = await response.json();
        setCountries(data.countries || []);
      } catch (error) {
        console.error('Error fetching countries:', error);
      } finally {
        setIsLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);

  useEffect(() => {
    if (textComplete) {
      const timers = [
        setTimeout(() => setShowCountrySelect(true), 500),
        setTimeout(() => setShowAirportSelect(true), 1000),
        setTimeout(() => setShowVisaCheckbox(true), 1500),
        setTimeout(() => setShowSubmitButton(true), 2000)
      ];
      return () => timers.forEach(timer => clearTimeout(timer));
    }
  }, [textComplete]);

  return (
    <>
      <Head>
        <title>Neighborhood</title>
        <meta name="description" content="a place we gather" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <style jsx global>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes popIn {
            0% { 
              opacity: 0;
              transform: translate(-50%, -50%) scale(0.8);
            }
            100% { 
              opacity: 1;
              transform: translate(-50%, -50%) scale(1);
            }
          }
          .modal-overlay {
            animation: fadeIn 0.3s ease-out;
          }
          .modal-content {
            animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
        `}</style>
      </Head>
      {!isLoading && showWelcomePopup && userData && (!userData.country || userData.hasVisa === undefined) && (
        <>
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 2999
          }} />
          <div style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "#ef758a",
            padding: "36px 32px 32px 32px",
            borderRadius: "16px",
            boxShadow: "0 2px 16px rgba(0,0,0,0.12)",
            zIndex: 3000,
            display: "flex",
            flexDirection: "column",
            gap: "0px",
            width: "400px",
            transition: "height 0.3s ease-in-out",
            overflow: "hidden"
          }}>
            <div style={{display: "flex", flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 18}}>
              <img 
                src="/pig.png" 
                alt="Pig" 
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  border: "1.5px solid #ffffff",
                  padding: "1px",
                }}
              />
              <span style={{ color: "#ffffff", fontWeight: 800, fontSize: 20 }}>Bay "Piggy"</span>
            </div>
            <div style={{marginBottom: 24}}>
              <AnimatedText 
                text="howdy! this is the bay piggy. I'm here to help with your travel to San Francisco. What airport are you traveling out of (to SF)?"
                onComplete={() => setTextComplete(true)}
              />
            </div>
            <div style={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: "24px",
              marginTop: "0px",
              transition: "all 0.3s ease-in-out"
            }}>
              {showCountrySelect && (
                <div style={{ 
                  opacity: showCountrySelect ? 1 : 0, 
                  transform: `translateY(${showCountrySelect ? '0' : '20px'})`,
                  transition: 'all 0.3s ease-in',
                  marginBottom: 0
                }}>
                  <label style={{ color: "#fff", display: "block", marginBottom: "10px", fontSize: 18, fontWeight: 500 }}>Select your country:</label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    disabled={isLoadingCountries}
                    style={{
                      width: "100%",
                      padding: "12px 10px",
                      borderRadius: "8px",
                      border: "1.5px solid #fff",
                      backgroundColor: "rgba(255, 255, 255, 0.13)",
                      color: "#fff",
                      fontSize: 16,
                      opacity: isLoadingCountries ? 0.5 : 1,
                      marginBottom: 0
                    }}
                  >
                    <option value="" style={{ color: "#000" }}>Select a country</option>
                    {countries.map((countryCode) => (
                      <option key={countryCode} value={countryCode} style={{ color: "#000" }}>
                        {countryCode}
                      </option>
                    ))}
                  </select>
                  {isLoadingCountries && (
                    <span style={{ color: "#fff", fontSize: "14px", marginTop: "4px" }}>Loading countries...</span>
                  )}
                </div>
              )}
              {showAirportSelect && (
                <div style={{ 
                  opacity: showAirportSelect ? 1 : 0,
                  transform: `translateY(${showAirportSelect ? '0' : '20px'})`,
                  transition: 'all 0.3s ease-in',
                  marginBottom: 0
                }}>
                  <label style={{ color: "#fff", display: "block", marginBottom: "10px", fontSize: 18, fontWeight: 500 }}>Select your airport:</label>
                  <select
                    value={selectedAirport}
                    onChange={(e) => setSelectedAirport(e.target.value)}
                    disabled={!selectedCountry || isLoadingAirports}
                    style={{
                      width: "100%",
                      padding: "12px 10px",
                      borderRadius: "8px",
                      border: "1.5px solid #fff",
                      backgroundColor: "rgba(255, 255, 255, 0.13)",
                      color: "#fff",
                      fontSize: 16,
                      opacity: !selectedCountry || isLoadingAirports ? 0.5 : 1,
                      marginBottom: 0
                    }}
                  >
                    <option value="" style={{ color: "#000" }}>Select an airport</option>
                    {airports.map((airport) => (
                      <option key={airport.code} value={airport.code} style={{ color: "#000" }}>
                        {airport.code} - {airport.name} ({airport.city})
                      </option>
                    ))}
                  </select>
                  {isLoadingAirports && (
                    <span style={{ color: "#fff", fontSize: "14px", marginTop: "4px" }}>Loading airports...</span>
                  )}
                </div>
              )}
              {showVisaCheckbox && (
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "10px",
                  opacity: showVisaCheckbox ? 1 : 0,
                  transform: `translateY(${showVisaCheckbox ? '0' : '20px'})`,
                  transition: 'all 0.3s ease-in',
                  marginBottom: 0
                }}>
                  <input
                    type="checkbox"
                    id="hasVisa"
                    checked={hasVisa}
                    onChange={(e) => setHasVisa(e.target.checked)}
                    disabled={selectedCountry === 'US'}
                    style={{
                      width: "18px",
                      height: "18px",
                      cursor: selectedCountry === 'US' ? 'not-allowed' : 'pointer',
                      accentColor: '#fff'
                    }}
                  />
                  <label htmlFor="hasVisa" style={{ color: "#fff", fontSize: 16 }}>
                    I already have a visa
                    {selectedCountry === 'US' && " (or citizen)"}
                  </label>
                </div>
              )}
              {showSubmitButton && (
                <button
                  onClick={handleSubmit}
                  disabled={!selectedCountry || !selectedAirport}
                  style={{
                    padding: "16px 0",
                    backgroundColor: "#fff",
                    color: "#ef758a",
                    border: "none",
                    borderRadius: "8px",
                    cursor: !selectedCountry || !selectedAirport ? "not-allowed" : "pointer",
                    opacity: !selectedCountry || !selectedAirport ? 0.5 : 1,
                    fontWeight: "bold",
                    fontSize: 18,
                    marginTop: "18px",
                    transform: `translateY(${showSubmitButton ? '0' : '20px'})`,
                    transition: 'all 0.3s ease-in'
                  }}
                >
                  Submit
                </button>
              )}
            </div>
          </div>
        </>
      )}
      {isSignedIn ? (
        <>
          <div
            style={{
              position: "absolute",
              top: "0px",
              left: "0px",
              right: "0px",
              bottom: "0px",
              zIndex: 2000,
              pointerEvents:
                UIPage ||
                showNeighborhoodPopup ||
                showPostsView ||
                showStopwatch ||
                showHomesWindow
                  ? "auto"
                  : "none",
            }}
          >
            {showPostsView && (
              <PostsViewComponent
                isExiting={isPostsViewExiting}
                onClose={handleClosePostsView}
                posts={latestPosts}
                userData={userData}
                isLoadingPosts={isLoadingPosts}
              />
            )}
            {showHomesWindow && (
              <HomesComponent
                isExiting={isHomesWindowExiting}
                onClose={handleCloseHomesWindow}
                userData={userData}
              />
            )}
            {showNeighborhoodPopup && (
              <NeighborhoodPopup
                onClose={() => setShowNeighborhoodPopup(false)}
              />
            )}
            {(UIPage == "rewards" || (isExiting && UIPage === "rewards")) && (
              <RewardsComponent
                isExiting={isExiting}
                onClose={handleCloseComponent}
                setUIPage={setUIPage}
              />
            )}
            {(UIPage == "journal" || (isExiting && UIPage === "journal")) && (
              <JournalComponent
                isExiting={isExiting}
                token={token}
                onClose={handleCloseComponent}
              />
            )}
            {(UIPage == "bulletin" || (isExiting && UIPage === "bulletin")) && (
              <BulletinComponent
                isExiting={isExiting}
                onClose={handleCloseComponent}
              />
            )}
            {(UIPage == "post" || (isExiting && UIPage === "post")) && (
              <PostComponent
                isExiting={isExiting}
                onClose={handleCloseComponent}
                userData={userData}
              />
            )}
            {(UIPage == "ship" || (isExiting && UIPage === "ship")) && (
              <ShipComponent
                isExiting={isExiting}
                onClose={handleCloseComponent}
                userData={userData}
              />
            )}
            {(UIPage == "challenges" ||
              (isExiting && UIPage === "challenges")) && (
              <ChallengesComponent
                isExiting={isExiting}
                onClose={handleCloseComponent}
              />
            )}
            {(UIPage == "start" || (isExiting && UIPage === "start")) && (
              <HackTimeComponent
                isExiting={isExiting}
                onClose={handleCloseComponent}
                userData={userData}
                setUserData={setUserData}
                slackUsers={slackUsers}
                setSlackUsers={setSlackUsers}
                connectingSlack={connectingSlack}
                setConnectingSlack={setConnectingSlack}
                searchSlack={searchSlack}
                setSearchSlack={setSearchSlack}
                setUIPage={setUIPage}
                isMuted={isMuted}
              />
            )}
            {(UIPage == "apps" || (isExiting && UIPage === "apps")) && (
              <AppsComponent
                isExiting={isExiting}
                onClose={handleCloseComponent}
                userData={userData}
              />
            )}

            {showStopwatch && isNewVersion && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 2500,
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  pointerEvents: "all",
                }}
              >
                <BrownStopwatchComponent
                  isExiting={isStopwatchExiting}
                  onClose={() => {
                    setIsStopwatchExiting(true);
                    setTimeout(() => {
                      setShowStopwatch(false);
                      setIsStopwatchExiting(false);
                    }, 300);
                  }}
                  userData={userData}
                />
                <StatsDisplayComponent userData={userData} />
              </div>
            )}
          </div>

          {!hasEnteredNeighborhood && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                height: "100vh",
                width: "100vw",
                zIndex: 0,
                overflow: "hidden",
              }}
            >
              <video
                autoPlay
                loop
                muted
                playsInline
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  position: "absolute",
                  zIndex: 0,
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              >
                <source src="video.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {hasEnteredNeighborhood && (
            <NeighborhoodEnvironment
              hasEnteredNeighborhood={hasEnteredNeighborhood}
              setHasEnteredNeighborhood={setHasEnteredNeighborhood}
              userData={userData}
            />
          )}

          <div style={{ position: "relative", zIndex: 5 }}>
            <div
              style={{
                height: "100vh",
                width: "100%",
                gap: 32,
                justifyContent: "space-between",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  right: 16,
                  top: 16,
                  display: "flex",
                  gap: 8,
                }}
              >
                {!hasEnteredNeighborhood && (
                  <div style={{ display: "flex", gap: 8 }}>
                    {isNewVersion && (
                      <>
                        <div
                          onClick={() => setShowStopwatch(true)}
                          style={{
                            width: 42,
                            height: 42,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#8b6b4a",
                            borderRadius: 8,
                            cursor: "pointer",
                            border: "1px solid #644c36",
                            transition:
                              "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                            transform: "scale(1)",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                            ":hover": {
                              transform: "scale(1.05)",
                              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                            },
                            ":active": {
                              transform: "scale(0.95)",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                            },
                          }}
                        >
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
                              stroke="#fff"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        <StatsDisplayComponent userData={userData} />
                      </>
                    )}
                    <div
                      onClick={toggleMute}
                      style={{
                        width: 42,
                        height: 42,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#ffffff",
                        borderRadius: 8,
                        cursor: "pointer",
                        border: "1px solid #B5B5B5",
                        transition:
                          "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                        transform: "scale(1)",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                        ":hover": {
                          transform: "scale(1.05)",
                          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                        },
                        ":active": {
                          transform: "scale(0.95)",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                        },
                      }}
                    >
                      <img
                        src={isMuted ? "/volume_off.svg" : "/volume.svg"}
                        style={{
                          width: 24,
                          height: 24,
                          opacity: 0.8,
                          transition: "all 0.2s ease",
                          transform: isMuted ? "scale(0.9)" : "scale(1)",
                        }}
                        alt={isMuted ? "Unmute" : "Mute"}
                      />
                    </div>
                    {userData && (
                      <div style={{ position: "relative" }}>
                        <div
                          id="ticket-button"
                          onClick={() => setTicketDropdown(!ticketDropdown)}
                          style={{
                            width: 42,
                            height: 42,
                            backgroundColor:
                              !userData?.moveInDate || !userData?.moveOutDate
                                ? "#EF758A"
                                : "#fff",
                            border: "1px solid #B5B5B5",
                            borderRadius: 8,
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                            transition:
                              "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                          }}
                        >
                          <img
                            className={
                              !userData?.moveInDate || !userData?.moveOutDate
                                ? "ticket-shake"
                                : ""
                            }
                            style={{
                              width: 24,
                              height: 24,
                              filter:
                                !userData?.moveInDate || !userData?.moveOutDate
                                  ? "brightness(0) invert(1)"
                                  : "none",
                              transition: "filter 0.2s",
                            }}
                            src="./ticket.svg"
                          />
                        </div>
                        <TicketDropdown
                          isVisible={ticketDropdown}
                          onClose={() => setTicketDropdown(false)}
                          userData={userData}
                          setUserData={setUserData}
                        />
                      </div>
                    )}
                    <img
                      id="profile-image"
                      style={{
                        width: 42,
                        border: "1px solid #B5B5B5",
                        backgroundColor: "#B5B5B5",
                        borderRadius: 8,
                        height: 42,
                        cursor: "pointer",
                      }}
                      src={userData?.profilePicture}
                      onClick={() => setProfileDropdown(true)}
                    />
                    {profileDropdown && (
                      <div
                        id="profile-dropdown"
                        style={{
                          position: "absolute",
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                          width: 240,
                          top: 48,
                          right: 0,
                          padding: 8,
                          borderRadius: 8,
                          backgroundColor: "#fff",
                          zIndex: 2,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            border: "1px solid #B5B5B5",
                            borderRadius: 8,
                            alignItems: "center",
                            flexDirection: "row",
                            gap: 8,
                            padding: 8,
                            minHeight: 40,
                          }}
                        >
                          {userData?.slackHandle ? (
                            <>
                              <img
                                style={{
                                  width: 24,
                                  border: "1px solid #B5B5B5",
                                  backgroundColor: "#B5B5B5",
                                  borderRadius: 8,
                                  height: 24,
                                  cursor: "pointer",
                                }}
                                src={userData?.profilePicture}
                                onClick={() => setProfileDropdown(true)}
                              />
                              <div>
                                <p style={{ fontSize: 14 }}>
                                  @{userData?.slackHandle}
                                </p>
                                <p style={{ fontSize: 8 }}>
                                  Slack ID: {userData?.slackId}
                                </p>
                              </div>
                            </>
                          ) : (
                            <span
                              style={{
                                fontSize: 14,
                                color: "#b77",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <span role="img" aria-label="warning">
                                ⚠️
                              </span>
                              We're not finding a slack profile attached to your
                              account. Make sure you're using the same email as
                              your slack account
                            </span>
                          )}
                        </div>

                        <SlackConnectionComponent
                          userData={userData}
                          setUserData={setUserData}
                        />

                        <div
                          style={{
                            display: "flex",
                            border: "1px solid #B5B5B5",
                            borderRadius: 8,
                            alignItems: "center",
                            flexDirection: "column",
                            gap: 8,
                            padding: 8,
                            minHeight: 40,
                          }}
                        >
                          <input
                            type="text"
                            placeholder="GitHub Username"
                            value={inputtedGithubUsername}
                            onChange={(e) => {
                              setInputtedGithubUsername(e.target.value);
                            }}
                            style={{
                              width: "100%",
                              padding: 8,
                              borderRadius: 6,
                              border: "1px solid #ccc",
                              fontSize: 14,
                            }}
                            onKeyDown={async (e) => {
                              if (e.key === "Enter") {
                                const username = inputtedGithubUsername;
                                try {
                                  const token =
                                    localStorage.getItem("neighborhoodToken") ||
                                    getToken();
                                  if (!token) {
                                    throw new Error(
                                      "No authentication token found",
                                    );
                                  }

                                  const response = await fetch(
                                    "/api/connectGithubUsername",
                                    {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        token,
                                        githubUsername: username,
                                      }),
                                    },
                                  );

                                  if (!response.ok) {
                                    throw new Error(
                                      "Failed to update GitHub username",
                                    );
                                  }

                                  setUserData((prev) => ({
                                    ...prev,
                                    githubUsername: username,
                                    githubSuccess: true,
                                  }));

                                  setTimeout(() => {
                                    setUserData((prev) => ({
                                      ...prev,
                                      githubSuccess: false,
                                    }));
                                  }, 2000);
                                } catch (error) {
                                  console.error(
                                    "Error updating GitHub username:",
                                    error,
                                  );
                                  alert(
                                    error.message ||
                                      "Failed to update GitHub username",
                                  );
                                }
                              }
                            }}
                          />
                          {userData?.githubSuccess && (
                            <div
                              style={{
                                color: "#4CAF50",
                                fontSize: 12,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <span role="img" aria-label="check">
                                ✓
                              </span>
                              Successfully connected!
                            </div>
                          )}
                          <button
                            style={{
                              width: "100%",
                              padding: 8,
                              borderRadius: 6,
                              border: "1px solid #000",
                              backgroundColor: "#fff",
                              cursor: "pointer",
                              fontSize: 14,
                            }}
                            onClick={async () => {
                              const username = inputtedGithubUsername;
                              try {
                                const token =
                                  localStorage.getItem("neighborhoodToken") ||
                                  getToken();
                                if (!token) {
                                  throw new Error(
                                    "No authentication token found",
                                  );
                                }

                                const response = await fetch(
                                  "/api/connectGithubUsername",
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      token,
                                      githubUsername: username,
                                    }),
                                  },
                                );

                                if (!response.ok) {
                                  throw new Error(
                                    "Failed to update GitHub username",
                                  );
                                }

                                setUserData((prev) => ({
                                  ...prev,
                                  githubUsername: username,
                                  githubSuccess: true,
                                }));

                                setTimeout(() => {
                                  setUserData((prev) => ({
                                    ...prev,
                                    githubSuccess: false,
                                  }));
                                }, 2000);
                              } catch (error) {
                                console.error(
                                  "Error updating GitHub username:",
                                  error,
                                );
                                alert(
                                  error.message ||
                                    "Failed to update GitHub username",
                                );
                              }
                            }}
                          >
                            {userData?.githubUsername
                              ? "Update GitHub Account"
                              : "Connect GitHub Account"}
                          </button>
                        </div>

                        {/* Jake the Dog Preference */}
                        <div
                          style={{
                            display: "flex",
                            border: "1px solid #B5B5B5",
                            borderRadius: 8,
                            alignItems: "flex-start",
                            flexDirection: "column",
                            gap: 8,
                            padding: 12,
                            minHeight: 40,
                          }}
                        >
                          <div style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: 8,
                            width: "100%"
                          }}>
                            <input
                              type="checkbox"
                              id="hideJakeTheDog"
                              checked={userData?.hideJakeTheDog || false}
                              onChange={async (e) => {
                                const hideJakeTheDog = e.target.checked;
                                try {
                                  const token = localStorage.getItem("neighborhoodToken") || getToken();
                                  if (!token) {
                                    throw new Error("No authentication token found");
                                  }

                                  const response = await fetch("/api/setJakeHidePreference", {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      token,
                                      hideJakeTheDog
                                    }),
                                  });

                                  if (!response.ok) {
                                    throw new Error("Failed to update Jake the Dog preference");
                                  }

                                  setUserData((prev) => ({
                                    ...prev,
                                    hideJakeTheDog
                                  }));
                                } catch (error) {
                                  console.error("Error updating Jake the Dog preference:", error);
                                  alert(error.message || "Failed to update Jake the Dog preference");
                                }
                              }}
                              style={{
                                width: 16,
                                height: 16,
                                cursor: "pointer"
                              }}
                            />
                            <label 
                              htmlFor="hideJakeTheDog"
                              style={{
                                fontSize: 14,
                                fontWeight: 500,
                                cursor: "pointer"
                              }}
                            >
                              Hide from Jake the Dog
                            </label>
                          </div>
                          <p style={{ 
                            fontSize: 12, 
                            color: "#666", 
                            margin: 0,
                            marginTop: 4
                          }}>
                            Jake the dog is a creature that will send you reminders and ask you to review projects. Hiding from Jake the Dog will mean he will leave you alone.
                          </p>
                        </div>

                        <button
                          style={{
                            backgroundColor: "#000",
                            cursor: "pointer",
                            color: "#fff",
                            border: "1px solid #000",
                            padding: 6,
                            borderRadius: 6,
                          }}
                          onClick={() => {
                            setProfileDropdown(false);
                            handleLogout();
                          }}
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div
                style={{
                  position: "absolute",
                  alignItems: "end",
                  right: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  bottom: 32,
                }}
              >
                {!hasEnteredNeighborhood && (
                  <button
                    onClick={() => {
                      setShowHomesWindow(true);
                    }}
                    style={{
                      padding: "8px 16px",
                      opacity:
                        userData?.hackatimeProjects?.length > 0 ? 1.0 : 0.1,
                      fontFamily: "M PLUS Rounded 1c",
                      fontSize: "24px",
                      width: "fit-content",
                      border: "1px solid #007C74",
                      background: "none",
                      cursor:
                        userData?.hackatimeProjects?.length > 0
                          ? "pointer"
                          : "not-allowed",
                      backgroundColor: "#FFF9E6",
                      color: "#007C74",
                      fontWeight: "bold",
                      borderRadius: "8px",
                    }}
                  >
                    Neighborhood Homes
                  </button>
                )}
                {!hasEnteredNeighborhood && (
                  <button
                    onClick={() => {
                      if (userData?.hackatimeProjects?.length > 0) {
                        setHasEnteredNeighborhood(true);
                      }
                    }}
                    style={{
                      padding: "8px 16px",
                      opacity:
                        userData?.hackatimeProjects?.length > 0 ? 1.0 : 0.1,
                      fontFamily: "M PLUS Rounded 1c",
                      fontSize: "24px",
                      border: "1px solid #FFF9E6",
                      background: "none",
                      cursor:
                        userData?.hackatimeProjects?.length > 0
                          ? "pointer"
                          : "not-allowed",
                      backgroundColor: "#007C74",
                      color: "#FFF9E6",
                      fontWeight: "bold",
                      borderRadius: "8px",
                    }}
                    title={
                      userData?.hackatimeProjects?.length > 0
                        ? ""
                        : "You need to have a Hackatime project to explore the neighborhood"
                    }
                  >
                    Explore Neighborhood
                  </button>
                )}
              </div>

              {!hasEnteredNeighborhood && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    paddingLeft: 32,
                    paddingTop: 32,
                    paddingRight: 32,
                    paddingBottom: 32,
                    height: "100%",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <img
                      style={{ width: 250, imageRendering: "pixelated" }}
                      src="./neighborhoodLogo.png"
                    />
                    {menuItems.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: isLoading ? "wait" : "pointer",
                          opacity: isLoading ? 0.5 : 1,
                        }}
                        onMouseEnter={() =>
                          !isLoading && setSelectedItem(item.id)
                        }
                        onMouseLeave={() => {}}
                        onClick={() =>
                          !isLoading && handleMenuItemClick(item.id)
                        }
                      >
                        <span
                          style={{
                            fontFamily: "M PLUS Rounded 1c",
                            fontSize: "24px",
                            color: "#FFF9E6",
                            visibility:
                              selectedItem === item.id ? "visible" : "hidden",
                            animation:
                              selectedItem === item.id
                                ? "blink 1s steps(1) infinite"
                                : "none",
                            fontWeight: "bold",
                          }}
                        >
                          {"●"}
                        </span>
                        <p
                          style={{
                            fontFamily: "M PLUS Rounded 1c",
                            fontSize: "32px",
                            color: "#F5F7E1",
                            fontWeight: "bold",
                          }}
                        >
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div>
                    {latestPosts.length != 0 && (
                      <div
                        style={{
                          backgroundColor: "#FFF9E6",
                          display: "flex",
                          flexDirection: "column",
                          width: "fit-content",
                          padding: 16,
                          borderRadius: 16,
                          gap: 8,
                          cursor: "pointer",
                        }}
                        onClick={() => setShowPostsView(true)}
                      >
                        <video
                          playsInline
                          style={{
                            width: "250px",
                            borderRadius: 16,
                            aspectRatio: "16/9",
                            objectFit: "cover",
                          }}
                          onMouseEnter={(e) => {
                            e.target.play();
                          }}
                          onMouseLeave={(e) => {
                            e.target.pause();
                            e.target.currentTime = 0;
                          }}
                          src={latestPosts[0].photoboothVideo}
                        />
                        <button
                          style={{
                            width: 200,
                            fontWeight: 600,
                            backgroundColor: "#007A72",
                            color: "#FFF9E6",
                            fontSize: 20,
                            border: "0px",
                            borderRadius: 8,
                            padding: 8,
                          }}
                        >
                          See Latest Posts
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <style jsx global>{`
              @keyframes blink {
                0% {
                  visibility: visible;
                }
                50% {
                  visibility: hidden;
                }
                100% {
                  visibility: visible;
                }
              }
              @keyframes ticketShake {
                0% {
                  transform: rotate(0deg) scale(1);
                }
                20% {
                  transform: rotate(-8deg) scale(1.05);
                }
                40% {
                  transform: rotate(8deg) scale(1.05);
                }
                60% {
                  transform: rotate(-6deg) scale(1.05);
                }
                80% {
                  transform: rotate(6deg) scale(1.05);
                }
                100% {
                  transform: rotate(0deg) scale(1);
                }
              }
              .ticket-shake {
                animation: ticketShake 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)
                  infinite;
              }
              @keyframes popIn {
                0% {
                  opacity: 0;
                  transform: scale(0.95);
                }
                100% {
                  opacity: 1;
                  transform: scale(1);
                }
              }

              @keyframes popOut {
                0% {
                  opacity: 1;
                  transform: scale(1);
                }
                100% {
                  opacity: 0;
                  transform: scale(0.95);
                }
              }

              .pop-in {
                animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
              }

              .pop-in.hidden {
                animation: popOut 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                opacity: 0;
                transform: scale(0.95);
              }
            `}</style>
          </div>
        </>
      ) : (
        <SignupComponent />
      )}
    </>
  );
}