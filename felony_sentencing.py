#Client information
print("Welcome to the intake calculator.")
attorney_name = input("What is your name? ")
client_name = input("What is your client's name? ")
xref = int(input("What is your client's xref? "))
print("Hello " + attorney_name + ", client's xref is " + str(xref) + ".")
court_date = input("What is the court date? ")
get_client_info = client_name + court_date + str(xref)
#Client's charged offense exposure
crime = input("Is the crime a felony, misdemeanor? ")
if crime == "felony":
    charged_offense = input("What is the charged offense(s)? ")
    base_term = int(input("What is the base term of the felony? "))
    midterm = float(input("What is the midterm of the second felony? "))
    midterm = midterm * 0.33
    enhancement_subtraction = input("Is there an enhancement or subtraction? ")
    enhancement = 0
    subtractions = 0
    if enhancement_subtraction == "yes":
        enh_or_sub = input("Type 'enhancement' or 'subtraction': ")
        if enh_or_sub == "enhancement":
            enhancement = int(input("What is the enhancement of the felony? "))
        elif enh_or_sub == "subtraction":
            subtractions = int(input("What are the subtractions of the felony? "))
    total_felony = (base_term + midterm) + enhancement - subtractions
    mitigations_aggravations = input("Is there a mitigation or aggravation? ")
    mitigation = 0
    aggravation = 0
    if mitigations_aggravations == "yes":
        mitigation = int(input("What is the mitigation of the felony? "))
        aggravation = int(input("What is the aggravation of the felony? "))
    total_felony = total_felony + mitigation + aggravation
    potential_charge = input("Is there a potential charge? ")
    if potential_charge == "yes":
        base_term_potential = int(input("What is the base term of the potential charge? "))
        midterm_potential = float(input("What is the midterm of the potential charge? "))
        midterm_potential = midterm_potential * 0.33
        total_potential = base_term_potential + midterm_potential
    else:
        print("There is no potential charge.")
elif crime == "misdemeanor":
    charged_offense = input("What is the charged offenses? ")
    base_term = int(input("What is the base term of the misdemeanor? "))
    midterm = float(input("What is the midterm of the misdemeanor? "))
    enhancement = int(input("What is the enhancement of the misdemeanor? "))
    subtractions = int(input("What are the subtractions of the misdemeanor? "))
    total_misdemeanor = (base_term + midterm) + enhancement - subtractions
    print("The maximum sentence for this misdemeanor is: " + str(total_misdemeanor))

#police report information
police_report = input("what is the police report information? ")
print("The police report information is: " + police_report)

#client's criminal history
criminal_history = input("Does the client have a criminal history? ")
if criminal_history == "yes":
    history_details = input("What are the details of the client's criminal history? ")
    print("The client's criminal history details are: " + history_details)
else:
    print("The client has no criminal history.")

#is there a plea deal?
plea_deal = input("Is there a plea deal? ")
if plea_deal == "yes":
    plea_bargain = input("What is the plea bargain? ")
    print("The plea bargain is: " + plea_bargain)
else:
    print("There is no plea deal.")
#clients rights
clients_rights = input("Did you go over client's rights? ")
if clients_rights == "yes":
    print("The client's rights have been explained.")
else:
    print("The client's rights have not been explained.")


#Summary of information
print("\n" + "="*40)
print("         SUMMARY OF INFORMATION")
print("="*40 + "\n")

print(f"Attorney: {attorney_name}")
print(f"Client's Name: {client_name}")
print(f"Client's XREF: {xref}")
print(f"Court Date: {court_date}")
print(f"Charged Offense(s): {charged_offense}")

if crime == "felony":
    print(f"Total Felony Exposure: {total_felony}")
elif crime == "misdemeanor":
    print(f"Total Misdemeanor Exposure: {total_misdemeanor}")
if crime == "felony" and potential_charge == "yes":
    print(f"Potential Charge Exposure: {total_potential}")

print(f"\nPolice Report Information:\n{police_report}")

print("\nCriminal History:")
if criminal_history == "yes":
    print(history_details)
else:
    print("No criminal history.")

print("\nPlea Deal:")
if plea_deal == "yes":
    print(plea_bargain)
else:
    print("No plea deal.")

print("\nClient's Rights:")
if clients_rights == "yes":
    print("The client's rights have been explained.")
else:
    print("The client's rights have not been explained.")

print("\n" + "="*40)
print(f"Thank you {attorney_name} for using the intake calculator.")
print("="*40 + "\n")
