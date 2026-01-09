a = int(input("Enter a value a: "))
b = int(input("Enter a value b: "))

step_count = 1
matrix = [[a, 1, 0],
          [b, 0, 1]]

print("\nmatrix is:")
print(matrix[0])
print(matrix[1])

def step(matrix):
    if (matrix[0][0] > matrix[1][0]):
        a1 = matrix[0][0] % matrix[1][0]
        factor = int((matrix[0][0]-a1)/ matrix[1][0])
        a2 = matrix[0][1] - factor * matrix[1][1]
        a3 = matrix[0][2] - factor * matrix[1][2]
        matrix = [[a1, a2, a3],
                [matrix[1][0], matrix[1][1], matrix[1][2]]]
    else:
        b1 = matrix[1][0] % matrix[0][0]
        factor = int((matrix[1][0]-b1)/ matrix[0][0])
        b2 = matrix[1][1] - factor * matrix[0][1]
        b3 = matrix[1][2] - factor * matrix[0][2]
        matrix = [[matrix[0][0], matrix[0][1], matrix[0][2]],
                [b1, b2, b3]]

    print(matrix[0])
    print(matrix[1])
    
    return matrix

while (matrix[0][0] != 0 and matrix[1][0] != 0):
    print("\nStep ", step_count)
    matrix = step(matrix)
    step_count += 1

if matrix[0][0] == 0:
    print("GCD is: ", matrix[1][0])
else:
    print("GCD is: ", matrix[0][0])
    
exit