#this is to be used for felony sentencing calculations
#abstract equation for felony sentencing: (base term + midterm) + enhancement – subtractions = maximum -mitigation – aggravation
#Enhancement may be a strike or a triad of years. 
#Great bodily injury adds three years to any base felony or can make none strikes into strikes.

base_term = input("What is the base term of the felony? ")
midterm = input("What is the midterm of the felony? ")
enhancement = input("What is the enhancement of the felony? ")
subtractions = input("What are the subtractions of the felony? ")

print("The maximum sentence for this felony is: " + str((int(base_term) + int(midterm)) + int(enhancement) - int(subtractions)))
maximum = (int(base_term) + int(midterm)) + int(enhancement) - int(subtractions)
mitigation = input("What is the mitigation of the felony? ")
aggravation = input("What is the aggravation of the felony? ")
print("The maximum sentence for this felony is: " + str(maximum - int(mitigation) - int(aggravation)))

