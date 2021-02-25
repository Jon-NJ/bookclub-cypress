# Cypress test suite for Bookclub Wordpress Plugin

This is a test-suite for the project bookclub-plugin. The test suit is being developed using the Cypress.io and Node.js testing framework. I am still learning how to use Cypress but all existing test cases have been migrated and there are some Cypress-only test cases that test email forwarding. The test suite has beta status. It is likely that there are parts of the code that are not optimal or correct.

## Installation
The test environment is built using Node.js, with Visual Studio Code and the npm package manager. The required packages (including cypress) will be installed at the project root folder using "npm install". A normal test run is invoked using:

* *update to the latest plug-in code*
* *reset the database to the state described below*
* npm install
* npm run test:cleanup
* npm run cy:run || true
* npm run report:merge
* npm run report:generate
* npm run report:copyScreenshots

After the test runs, an HTML report will be found in *cypress/reports/html/mochawesome-bundle.html*. Videos from the run will be found in *cypress/videos*.

## Site Installation
A WordPress site should already be installed with certain users. There is also a base data import which is used to reset the database. And one of the test sets (*Test Install*) can be used to import the master data and configure the site. 

* Basic WordPress installation
  * Site name: bookclub.cloud.sunshine (https - self-signed certificate)
  * Database at the given site with database name, owner name and password all *bookclub*
  * Users: WordPress user ID, login (First Last) names, role, *password*, email
    * 1 jonnj - Administrator *bookclub-test* 
    * 2 adamz Adam Zappa - Administrator *az-password* az@bookcub.cloud.sunshine
    * 3 beaty Beatrice Young - Subscriber *by-password* by@bookcub.cloud.sunshine
    * 4 chrisx Christine Xavier - Administrator *cy-password* cx@bookcub.cloud.sunshine
    * 5 denisw Denis Williams - Subscriber *dw-password* dw@bookcub.cloud.sunshine
    * 6 garth Gary Thoms - Subscriber *gt-password* gt@bookcub.cloud.sunshine
  * Each of these users is also configured for an email account with the IMAP/SMTP server at sunshine.dyndns.myonlineportal.de.
  * Additional email accounts:
    * bookclub@bookclub.cloud.sunshine *bc-password*
    * listserver@bookclub.cloud.sunshine *ls-password*
    * Edward Vasco *ev-password* ev@bookclub.cloud.sunshine
    * Florence Unger *fu-password* fu@bookclub.cloud.sunshine
  * Pages must be created for the following shortcodes:
    * Book [bookclub type='book'] - book
    * Book Club [bookclub type='main'] (main page)
    * Future [bookclub type='forthcoming'] - future
    * Previous [bookclub type='previous'] - previous
    * RSVP [bookclub type='rsvp'] - rsvp
    * Sign Up [bookclub type='signup'] - signup
  * Reading - Your homepage displays - A static page "Book Club"
  * Permalinks - Permalink Settings - Post name

It am looking into the possibility of creating a docker container that can be used to run tests, but at the moment this is beyond my capabilities. The domain *bookclub.cloud.sunshine* is faked using an override in */etc/hosts*. The domain *sunshine.dyndns.myonlineportal.de* for the email server is real and private, but this could also be faked.

## Version numbering
The project was started on 2021-01-30. I find it useful in some way to include the commit date in the version number as long as the software is still in the alpha stage. The major version number is zero for 2021 or until it reaches some level of maturity. Version 0.M.D represents month M and day D. I wish to avoid having more than one commit per day, but only three parts are prescribed. So the day will be bumped into the future if necessary. But at the end of the month it will not be necessary to bump up the M part since D can continue to increase. Month will be increased past 12 if the project is still in an alpha stage in 2022.

## Test Sets ##
* **Author Tests** - Tests to add/edit/remove authors.
* **Book Tests** - Tests to add/edit/remove books.
* **EMail Forwarding** - A test set for various scenarios forwarding email using the listserver.
* **Profile Tests** - Test to ensure that the user can edit their profile and are blocked on admin pages.
* **RSVP Tests** - A user RSVP's to a given event.
* **SignUp Tests** - A test set for various scenarios when a member signs up.
* **Test Install** - Will activate the plugin and import master data. (Runs first.)
