#
# Login utilities
#


#' Get email of the user based on browser data object
#'
#' @param browserData {List} Browser data
#' @return email {Character} Email of user or guest email
#' @export
mxGetInitEmail <- function(browserData){

  res <- NULL

  timeNowSeconds <- as.numeric(Sys.time())
  maxSecondsValid <- .get(config,c("users","cookieExpireDays")) * 86400
  emailGuest <- .get(config,c("mail","guest"))
  emailUser <- NULL

  # TODO: make better validation
  isBrowserDataValid <- isTRUE(length(browserData)>0) && !noDataCheck(browserData$cookies)

  #
  # Check that the GUEST account exists
  #
  if(!mxDbEmailIsKnown(emailGuest)){
    mxDbCreateUser(emailGuest)
  }

  #
  # If there is values in cookies
  #
  if(isBrowserDataValid){
    #
    # Look for the default cookie name (e.g. mx_data)
    #
    cookies <- browserData$cookies
    cookieData <- mxDbDecrypt(cookies[[.get(config,c("users","cookieName"))]])

    #
    # Check for issues
    #
    hasNoError <- !isTRUE("try-error" %in% class(cookieData))
    hasLength <- isTRUE(length(cookieData)>0)
    browserParams <- .get(config,c("browser","params"))

    hasExpectedKeys <- isTRUE(all(c(
          browserParams %in% names(cookieData),
          browserParams %in% names(browserData)
          )))

    if( hasNoError && hasLength && hasExpectedKeys){

      #
      # Check if values match
      #
      browserMatch <- identical(
        cookieData[browserParams],
        browserData[browserParams]
      )

      isYetValid <- isTRUE( 
        timeNowSeconds <= cookieData$timestamp + maxSecondsValid 
      )

      if( browserMatch && isYetValid ){
        #
        # Get the user email
        #
        emailUser <- mxDbGetEmailFromId(cookieData$id_user)
      }
    }
  }

  #
  # If email is valid, use this to set as login email 
  # 
  if(!mxEmailIsValid(emailUser)){
    emailUser = emailGuest 
  }

  return(emailUser)
}

#' Login : get user info and set cookies
#' @param {Character} email to login
#' @param {List} browserData list of data for fingerprinting browser
#' @param {List} query URL query
#' @param {ReactiveList} reactData Reactive list
#' @return {List} user data
mxLogin <- function(email,browserData,query, reactData){

  isReactiveContext <- !noDataCheck(shiny:::getDefaultReactiveDomain())
  hasExpired <- FALSE
  hasInvalidMail <- FALSE

  forceProject <- ""

  isGuest <- FALSE
  emailGuest <- .get(config,c("mail","guest"))
  actionLinkExpireSeconds <- .get(config,c("users","actionLinkExpireDays")) * 86400
  emailNewMember <- ""
  timeNow <- Sys.time()
  timeNowSeconds <- as.numeric(timeNow)
  actionLink <- .get(query,c("action"),list())
  useAutoRegister <- isTRUE(.get(actionLink,c("id")) == "auto_register")
  useInviteMember <- isTRUE(.get(actionLink,c("id")) == "invite_member")
  language <- .get(query,c("language"),.get(config,c("language","default")))

  if( useInviteMember || useAutoRegister ){
    #
    # useInviteMember : user request join > email > admin click > she is here > quick login
    # useAutoRegister : Admin invited user > email > user click > he is here > quick login
    #
    timestamp <- as.POSIXlt(.get(actionLink,c('timestamp')),origin = "1970-01-01", tz = "UTC")
    data <- .get(actionLink,c('data'),list())
    email <- ifelse(useInviteMember,
      .get(data,c('email_admin')),
      .get(data,c('email_auto'))
    )
    forceProject <- .get(data,c('project'))
    timeExpire <- timestamp + actionLinkExpireSeconds 
    hasExpired <- isTRUE(timeExpire < timeNow)

    if(!hasExpired && useAutoRegister){
      #
      # Trigger notification to admins / contact
      #
      reactData$notifyAdminAutoRegister <- list(
           timeExpire = timeExpire,
           project = forceProject,
           email = .get(data,c('email_auto'))
      )    
    }
  }

  # make sure to use lowercase and trimed email
  email <- trimws(tolower(email))

  # test for invalid email
  hasInvalidMail <- !mxEmailIsValid(email)

  #
  # Modal with issue if any
  # if any, set email to emailGuest
  #
  if( hasInvalidMail || hasExpired ){
    err <- tagList()

    if(hasInvalidMail) err <- tagList(err,tags$p(dd("error_email_not_valid",language)))
    if(hasExpired) err <-  tagList(err,tags$p(dd("error_action_link_expired",language)))

    mxModal(
      title = dd("error_login",language),
      content = err
    )

    email <- emailGuest
    isGuest <- TRUE
  }

  # check if the account is "guest"
  isGuest <- isTRUE(isGuest) || isTRUE(email == .get(config,c("mail","guest")))

  # Check if this is a new account (unknown email)
  newAccount <- !isTRUE(isGuest) && !mxDbEmailIsKnown(email)

  if( newAccount ){

    #
    # Create new user
    # 
    mxDbCreateUser(
      email = email,
      timeStamp = timeNow,
      language = language
    )

  }else{

    #
    # Save last visit
    #
    mxDbUpdate(
      table = .get(config,c("pg","tables","users")),
      column = 'date_last_visit',
      idCol = 'email',
      id = email,
      value = timeNow
    )
  }
  #
  # Get user info
  #
  userInfo <- mxDbGetUserInfoList(email=email)

  hasValidId <- isTRUE(is.integer(userInfo$id))

  # if it's empty or not an integer, stop
  if( !hasValidId ) {
    email <- emailGuest
    isGuest <- TRUE
  }

  #
  # Handle auto_register after account validation
  #
  if( !isGuest && useAutoRegister ){
    mxDbProjectAddUser(
      idProject = forceProject,
      idUser = userInfo$id,
      roles=c('members') # could be extracted from invite link ?
    )
  }
  
  #
  # If query action was performed, forceProject is set and
  # bypass last_project value. 
  #
  updateProject <- !isGuest && (useAutoRegister || useInviteMember ) && !noDataCheck(forceProject) 
  if( updateProject ){
    mxDbUpdate(
      table = .get(config,c("pg","tables","users")),
      idCol = 'id',
      id = userInfo$id,
      column = 'data',
      path = c("user","cache","last_project"),
      value = forceProject
    )
    ctrlProject <- .get(mxDbGetUserInfoList(1),c('data','user','cache','last_project'))
    mxDebugMsg('Project match:'+ identical(forceProject,ctrlProject))
  }

  #
  # Encrypt and save cookie
  #
  toStore = list(
    id_user = userInfo$id,
    timestamp = timeNowSeconds
  )

  toStore <- c(
    toStore,
    browserData[.get(config,c("browser","params"))]
  )

  ck <- mxDbEncrypt(toStore)

  # As we could have more than one cookie, save as list, name it
  ck <- list(ck)
  names(ck) <- .get(config,c("users","cookieName"))

  # Send to client
  mxSetCookie(
    cookie = ck,
    expireDays = .get(config,c("users","cookieExpireDays"))
  )

  #
  # Save user id in mx.settings.user.id
  #
  token <- mxDbEncrypt(list(
      key = userInfo$key,
      is_guest = isGuest,
      valid_until = timeNowSeconds + .get(config,c("users","cookieExpireDays")) * 86400
      ))


  #
  # Get user info
  #
  mxDebugMsg(" User " + email +" loged in.")
  #
  # Return user info data
  #
  return(list(
      isGuest = isGuest,
      info = userInfo,
      token = token
      ))

}
