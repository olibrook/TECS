import sys

import PIL.Image as Image


def twos_comp(val, bits):
    """compute the 2's compliment of int value val"""
    if (val & (1 << (bits - 1))) != 0:  # if sign bit is set e.g., 8bit: 128-255
        val -= (1 << bits)        # compute negative value
    return val


def convert(data):
    i = 0
    words = []
    while i < len(data):
        j = 0
        word = ''
        while j < 16:

            if data[i] == 0:
                bit = '1'
            elif data[i] == 255:
                bit = '0'
            else:
                raise Exception('Not a 1-bit image.')

            word += bit
            j += 1
            i += 1

        # Screen words have lsb on left
        word_int = int(''.join(reversed(word)), 2)
        word_int = twos_comp(word_int, 16)

        if word_int == -32768:
            # Jack doesn't support this literal
            words.append('(-32767 - 1)')
        else:
            words.append(str(word_int))

    return words


def main():
    """Given a 1-bit image file, write the image to stdout in a format that
    can be pasted into a JACK program.

    """
    if not (len(sys.argv) == 2):
        raise Exception("Specify a file to convert")
    img = Image.open(sys.argv[1])
    data = img.getdata()

    if not ((len(data) % 16) == 0):
        raise Exception("Width of the bitmap should be divisible by 16")

    words = convert(data)
    w, h = img.size
    width_in_words = w/16

    j = 0
    for i in range(0, len(words), width_in_words):
        print("do ({}, {});".format(j, ", ".join(words[i:i+width_in_words])))
        j += 1


if __name__ == '__main__':
    main()


