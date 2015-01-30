import itertools
import argparse

import PIL.Image as Image


def twos_comp(val, bits):
    """Compute the 2's compliment of int value val"""
    if (val & (1 << (bits - 1))) != 0:  # if sign bit is set e.g., 8bit: 128-255
        val -= (1 << bits)        # compute negative value
    return val


def grouper(iterable, n, fillvalue=None):
    """Collect data into fixed-length chunks or blocks

    Eg. grouper('ABCDEFG', 3, 'x') --> ABC DEF Gxx
    """
    args = [iter(iterable)] * n
    return itertools.izip_longest(fillvalue=fillvalue, *args)


def interleave_padding(it, data_width, padded_width, pad):
    repeater = itertools.repeat(pad)
    done = False
    while not done:
        i = 0
        try:
            while i < data_width:
                yield it.next()
                i += 1
        except StopIteration:
            if (i < padded_width) and (i > 0):
                done = True
                pass
            else:
                raise

        while i < padded_width:
            yield repeater.next()
            i += 1


def color_to_text(color):
    if color == 0:
        return '@'
    elif color == 255:
        return '.'
    else:
        raise Exception("Not a binary image.")


def color_to_bit(color):
    if color == 0:
        return '1'
    elif color == 255:
        return '0'
    else:
        raise Exception("Not a binary image.")


def to_hack_literal(str_16_bit):
    """Convert a 16-bit binary string to a hack integer literal.

    :param str_16_bit: str
    :return: str
    """
    # On the HACK screen lsb is on left
    word_int = int(''.join(reversed(str_16_bit)), 2)
    word_int = twos_comp(word_int, 16)

    if word_int == -32768:
        # Jack doesn't support this literal
        return '(-32767 - 1)'
    else:
        return str(word_int)


def main():
    parser = argparse.ArgumentParser(
        description='Convert binary bitmap images to Jack source code format.'
    )
    parser.add_argument(
        'file', help='path to image file',
        type=str, nargs=1)

    parser.add_argument(
        '--preview', help='print an ASCII version of the image to stdout',
        dest='preview', action='store_true', default=False)

    parser.add_argument(
        '--func_name', help='wrap Jack source in calls to a named function',
        dest='func_name', default='XXX')

    ns = parser.parse_args()

    white = 255
    word_width = 16

    img = Image.open(ns.file[0])
    input_width, input_height = img.size

    output_width_pixels = input_width + (input_width % word_width)
    output_width_words = output_width_pixels / word_width

    seq = itertools.chain(img.getdata())
    seq = interleave_padding(seq, input_width, word_width, white)

    if ns.preview:
        seq = (color_to_text(x) for x in seq)
        for row in grouper(seq, output_width_pixels):
            print(''.join(row))

    else:
        seq = (color_to_bit(x) for x in seq)
        seq = (''.join(bits) for bits in grouper(seq, word_width))
        seq = (to_hack_literal(binary) for binary in seq)

        for i, row in enumerate(grouper(seq, output_width_words)):
            print("do {}({}, {});".format(ns.func_name, i, ', '.join(row)))


