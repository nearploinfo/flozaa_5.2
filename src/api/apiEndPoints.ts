// Backend endpoint slugs. No leading slash — appended to NEXT_PUBLIC_API_URL as-is.
// No logic here, constants only.

// Home / Discovery
export const getHomePage = "get_home_screen_data";
export const getCategory = "get_categories";
export const getSubCategories = "get_sub_categories";
export const allCategories = "all_categories";
export const allCategoriesHierarchical = "get_categories_hierarchical";
export const getCategoriesHierarchical = "get_categories_hierarchical";
export const getParentCategorySlug = "get_parent_category_slug";
export const getProviders = "get_providers";
export const getProvidersOnMap = "get_providers_on_map";
export const getAllProviders = "get_all_providers";
export const getProviderDetails = "get_provider_details";
export const getServices = "get_services";
export const getAllServices = "get_all_services";
export const getServiceDetails = "get_service_details";
export const searchServicesProviders = "search_services_providers";
export const getPlacesForWeb = "get_places_for_web";
export const getPlacesDeatilsForWeb = "get_place_details_for_web";

// Settings / Config
export const getSettings = "get_settings";
export const getThemeColors = "get_theme_colors";
export const getWebLandingPage = "get_web_landing_page";
export const getBecomeProviderSetings = "get_become_provider_settings";
export const getPageSettings = "get_page_setting";
export const getCustomPages = "get_custom_pages";
export const getSeoSettings = "get_seo_settings";
export const getLanguageList = "get_language_list";
export const getLanguageJsonData = "get_language_json_data";
export const getAddressCustomFields = "get_address_custom_fields";
export const getChatQuestions = "get_chat_questions";

// Auth (customer)
export const verifyUser = "verify_user";
export const manageUser = "manage_user";
export const verifyOTP = "verify_otp";
export const resendOTP = "resend_otp";
export const updateUser = "update_user";
export const deleteUserAccount = "delete_user_account";
export const logout = "logout";
export const getUserInfo = "get_user_info";
export const updateFcm = "update_fcm";

// Auth (provider)
export const registerProvider = "register_provider";
export const verifyProvider = "verify_provider";
export const verifyProviderOtp = "verify_provider_otp";
export const resendProviderOtp = "resend_provider_otp";
export const changePassword = "change_password";

// Address
export const addAddress = "add_address";
export const deleteAddress = "delete_address";
export const getAddress = "get_address";
export const requestAreaCoverage = "request_area_coverage";
export const getCountries = "get_countries";
export const getRegions = "get_regions";
export const getCountrySettings = "get_country_settings";
export const getCountryCodes = "get_country_codes";

// Cart / Checkout
export const getCart = "get_cart";
export const manageCart = "manage_cart";
export const removeFromCart = "remove_from_cart";
export const providerCheckAvailability = "provider_check_availability";
export const checkAvailableSlot = "check_available_slot";
export const releaseSlotLock = "release_slot_lock";
export const getAvailableSlot = "get_available_slots";
export const placeOrder = "place_order";
export const getPromoCodes = "get_promo_codes";
export const getAllPromocodes = "get_all_promocodes";
export const validatePromoCode = "validate_promo_code";

// Payments
export const createRazorOrder = "razorpay_create_order";
export const stripePaymentIntent = "create_stripe_payment_intent";
export const createCashfreeOrder = "cashfree_create_order";
export const addTransaction = "add_transaction";
export const getTransaction = "get_transactions";

// Orders
export const getOrders = "get_orders";
export const getAllBookings = "get_all_bookings";
export const getBookingDetails = "get_booking_details";
export const updateOrderStatus = "update_order_status";
export const downloadInvoices = "invoice-download";
export const getLiveTrackingData = "get_live_tracking_data";

// Custom job requests
export const makeCustomJobRequest = "make_custom_job_request";
export const fetchMyCustomJobRequests = "fetch_my_custom_job_requests";
export const getCustomJobRequests = "get_custom_job_requests";
export const fetchMyCustomJobBidders = "fetch_custom_job_bidders";
export const cancleCustomJobReq = "cancle_custom_job_request";
export const getCustomJobRequestDetails = "get_custom_job_request_details";
export const getCustomJobRequestProviders = "get_custom_job_request_providers";

// Ratings / Reviews
export const getRatings = "get_ratings";
export const addRating = "add_rating";
export const saveHandymanReview = "save_handyman_review";
export const getHandymanReviews = "get_handyman_reviews";

// Bookmarks
export const bookMark = "book_mark";

// Notifications
export const getNotifications = "get_notifications";

// Chat
export const getChatProviderList = "get_chat_providers_list";
export const getChatHistory = "get_chat_history";
export const sendChatMessage = "send_chat_message";
export const blockUser = "block_user";
export const unblockUser = "unblock_user";
export const deleteChatUser = "delete_chat_user";
export const markMessageAsRead = "mark_message_as_read";
export const getBlockedProviders = "get_blocked_providers";

// Reasons
export const getReportReasons = "get_report_reasons";
export const getReasons = "get_reasons";

// Content
export const getFaqs = "get_faqs";
export const contactUsApi = "contact_us_api";
export const getBlogs = "get_blogs";
export const getSiteMapData = "get_site_map_data";
export const getBlogCategories = "get_blog_categories";
export const getBlogTags = "get_blog_tags";
export const getBlogDetails = "get_blog_details";
