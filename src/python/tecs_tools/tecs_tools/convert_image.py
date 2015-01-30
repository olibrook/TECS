import itertools
import argparse
import string

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
        '--image_name', help='name for the image in Jack source code',
        dest='image_name', default='XXX')

    parser.add_argument(
        '--class_name', help='name of the class which loads the image in Jack',
        dest='class_name', default='XXX')

    ns = parser.parse_args()

    white = 255
    word_width = 16

    img = Image.open(ns.file[0])
    input_width, input_height = img.size

    output_width_pixels = input_width + (input_width % word_width)
    output_width_words = output_width_pixels / word_width
    output_height_words = input_height

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

        if not output_width_words <= len(string.ascii_letters):
            raise Exception('Cannot generate enough JACK identifiers')

        store_function = 'store{}'.format(ns.image_name)
        load_function = 'load{}'.format(ns.image_name)

        store_calls = ""
        for i, row in enumerate(grouper(seq, output_width_words)):
            store_calls += "do {}.{}({}, {});".format(
                ns.class_name, store_function, i, ', '.join(row))

        identifiers = string.ascii_letters[:output_width_words]
        parameter_list = ", ".join(
            'int {}'.format(identifier) for identifier in identifiers)

        assignments = "".join(
            "let arr[{}] = {};".format(i, identifier)
            for i, identifier in enumerate(identifiers)
        )

        ctx = dict(
            image_name=ns.image_name,
            parameter_list=parameter_list,
            assignments=assignments,
            store_calls=store_calls,
            class_name=ns.class_name,
            store_function=store_function,
            load_function=load_function,
            output_width_words=output_width_words,
            output_height_words=output_height_words,
        )

        code = """

    // Add to statics
    static Array {image_name}Bmp;
    static int {image_name}BmpCols;
    static int {image_name}BmpRows;

    /*
     * Initializes the "{image_name}" bitmap.
     * GENERATED CODE
     */
    function void init{image_name}Bmp() {{
        let {image_name}BmpCols = {output_width_words};
        let {image_name}BmpRows = {output_height_words};
        let {image_name}Bmp = Array.new({output_height_words});
        do {class_name}.{load_function}();
        return;
    }}

    /**
     * GENERATED CODE
     */
    function void {store_function}(int index, {parameter_list}){{
        var Array arr;
        let arr = Array.new({output_width_words});
        let {image_name}Bmp[index] = arr;
        {assignments}
        return;
    }}

    /**
     * GENERATED CODE
     */
    function void {load_function}(){{
        {store_calls}
        return;
    }}

        """.format(**ctx)

        print(code)
